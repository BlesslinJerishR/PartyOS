import {
  Injectable,
  Logger,
  OnModuleInit,
  OnModuleDestroy,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Agent, fetch as undiciFetch } from 'undici';
import { Resolver } from 'node:dns/promises';
import * as dns from 'node:dns';

@Injectable()
export class TmdbHttpService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(TmdbHttpService.name);
  private readonly agent: Agent;
  private readonly dnsResolver: Resolver;

  // DNS resolution cache: hostname → { addresses, expiry }
  private readonly dnsCache = new Map<
    string,
    { addresses: string[]; expiry: number }
  >();
  private readonly dnsCacheTtlMs: number;

  // Retry configuration
  private readonly maxRetries: number;
  private readonly timeoutMs: number;

  // Circuit breaker state
  private consecutiveFailures = 0;
  private circuitOpenUntil = 0;
  private static readonly CIRCUIT_THRESHOLD = 10;
  private static readonly CIRCUIT_RESET_MS = 60_000;

  constructor(private readonly configService: ConfigService) {
    const dnsServers = this.configService
      .get<string>('TMDB_DNS_SERVERS', '1.1.1.1,1.0.0.1,8.8.8.8,8.8.4.4')
      .split(',')
      .map((s) => s.trim());

    this.maxRetries = this.configService.get<number>('TMDB_MAX_RETRIES', 3);
    this.timeoutMs = this.configService.get<number>('TMDB_TIMEOUT_MS', 15000);
    this.dnsCacheTtlMs =
      this.configService.get<number>('TMDB_DNS_CACHE_TTL_SECONDS', 300) * 1000;

    // Custom DNS resolver using Cloudflare & Google public DNS
    // This bypasses ISP DNS blocking of TMDB in regions like India
    this.dnsResolver = new Resolver();
    this.dnsResolver.setServers(dnsServers);

    // Create undici Agent with custom DNS lookup
    this.agent = new Agent({
      connect: {
        lookup: this.customLookup.bind(this) as any,
      },
      connectTimeout: this.timeoutMs,
      bodyTimeout: 30_000,
      headersTimeout: this.timeoutMs,
    });

    this.logger.log(
      `TMDB HTTP client configured with DNS servers: ${dnsServers.join(', ')}`,
    );
  }

  async onModuleInit() {
    // Pre-warm DNS cache so the first request doesn't pay the resolution cost
    try {
      const addresses = await this.dnsResolver.resolve4('api.themoviedb.org');
      this.dnsCache.set('api.themoviedb.org', {
        addresses,
        expiry: Date.now() + this.dnsCacheTtlMs,
      });
      this.logger.log(
        `Pre-resolved api.themoviedb.org → ${addresses.join(', ')}`,
      );
    } catch (err: any) {
      this.logger.warn(
        `DNS pre-warm failed for api.themoviedb.org: ${err.message}`,
      );
    }
  }

  async onModuleDestroy() {
    await this.agent.close();
  }

  /**
   * Custom DNS lookup that uses Cloudflare/Google DNS, with fallback to system DNS.
   * Matches the signature expected by undici Agent's connect.lookup option.
   */
  private customLookup(
    hostname: string,
    _options: unknown,
    callback: (
      err: NodeJS.ErrnoException | null,
      address: string,
      family: number,
    ) => void,
  ): void {
    // Check DNS cache first
    const cached = this.dnsCache.get(hostname);
    if (cached && cached.expiry > Date.now()) {
      // Round-robin through cached addresses for basic load distribution
      const addr =
        cached.addresses[
          Math.floor(Math.random() * cached.addresses.length)
        ];
      return callback(null, addr, 4);
    }

    // Resolve via Cloudflare/Google DNS (IPv4 first, then IPv6 fallback)
    this.dnsResolver
      .resolve4(hostname)
      .then((addresses) => {
        if (addresses.length === 0) {
          return this.fallbackToSystemDns(hostname, callback);
        }
        this.dnsCache.set(hostname, {
          addresses,
          expiry: Date.now() + this.dnsCacheTtlMs,
        });
        callback(null, addresses[0], 4);
      })
      .catch(() => {
        // Try IPv6 before falling back to system DNS
        this.dnsResolver
          .resolve6(hostname)
          .then((addresses) => {
            if (addresses.length === 0) {
              return this.fallbackToSystemDns(hostname, callback);
            }
            callback(null, addresses[0], 6);
          })
          .catch(() => this.fallbackToSystemDns(hostname, callback));
      });
  }

  private fallbackToSystemDns(
    hostname: string,
    callback: (
      err: NodeJS.ErrnoException | null,
      address: string,
      family: number,
    ) => void,
  ): void {
    this.logger.warn(
      `Custom DNS resolution failed for ${hostname}, falling back to system DNS`,
    );
    dns.lookup(hostname, 4, (err, address) => {
      if (err) return callback(err, '', 0);
      callback(null, address, 4);
    });
  }

  /**
   * Fetch data from TMDB API with:
   * - Custom DNS resolution (Cloudflare/Google) to bypass ISP blocking
   * - Automatic retry with exponential backoff
   * - Circuit breaker to prevent cascading failures
   * - Configurable timeout
   */
  async fetch<T = any>(url: string): Promise<T> {
    // Circuit breaker: fail fast if too many recent failures
    if (Date.now() < this.circuitOpenUntil) {
      throw new HttpException(
        'TMDB API is temporarily unavailable. Please try again shortly.',
        HttpStatus.SERVICE_UNAVAILABLE,
      );
    }

    let lastError: Error = new Error('Unknown TMDB error');

    for (let attempt = 0; attempt <= this.maxRetries; attempt++) {
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), this.timeoutMs);

        const response = await undiciFetch(url, {
          dispatcher: this.agent,
          signal: controller.signal,
        });

        clearTimeout(timeoutId);

        if (!response.ok) {
          const body = await response.text().catch(() => '');

          // Don't retry client errors (4xx) except 429 rate limit
          if (
            response.status >= 400 &&
            response.status < 500 &&
            response.status !== 429
          ) {
            throw new HttpException(
              `TMDB API error: ${body || response.statusText}`,
              response.status,
            );
          }

          throw new Error(
            `TMDB HTTP ${response.status}: ${body || response.statusText}`,
          );
        }

        const data = (await response.json()) as T;

        // Reset circuit breaker on success
        this.consecutiveFailures = 0;
        return data;
      } catch (error: any) {
        lastError = error;

        // Propagate client errors immediately without retry
        if (error instanceof HttpException && error.getStatus() < 500) {
          throw error;
        }

        this.consecutiveFailures++;

        // Trip circuit breaker after threshold consecutive failures
        if (
          this.consecutiveFailures >= TmdbHttpService.CIRCUIT_THRESHOLD
        ) {
          this.circuitOpenUntil =
            Date.now() + TmdbHttpService.CIRCUIT_RESET_MS;
          this.logger.error(
            `Circuit breaker OPEN after ${this.consecutiveFailures} consecutive failures`,
          );
        }

        if (attempt < this.maxRetries) {
          const delay = Math.min(1000 * Math.pow(2, attempt), 8000);
          this.logger.warn(
            `TMDB attempt ${attempt + 1}/${this.maxRetries + 1} failed: ${error.message}. Retrying in ${delay}ms`,
          );
          await new Promise((r) => setTimeout(r, delay));
        }
      }
    }

    this.logger.error(
      `All ${this.maxRetries + 1} TMDB fetch attempts failed: ${lastError.message}`,
    );
    throw new HttpException(
      'Unable to reach TMDB. The service may be temporarily unavailable in your region.',
      HttpStatus.SERVICE_UNAVAILABLE,
    );
  }
}
