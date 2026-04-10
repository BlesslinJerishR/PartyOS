import {
  Injectable,
  Logger,
  OnModuleInit,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as https from 'node:https';

/**
 * DNS-over-HTTPS record from Cloudflare/Google JSON API.
 */
interface DoHAnswer {
  name: string;
  type: number;
  TTL: number;
  data: string;
}

interface DoHResponse {
  Status: number;
  Answer?: DoHAnswer[];
}

@Injectable()
export class TmdbHttpService implements OnModuleInit {
  private readonly logger = new Logger(TmdbHttpService.name);

  // DNS-over-HTTPS endpoints (IP-based so they don't need DNS resolution themselves)
  // These are the exact mechanism Chrome "Secure DNS" uses — queries go over
  // HTTPS (port 443), completely bypassing ISP DNS interception/blocking.
  private readonly dohEndpoints = [
    { url: 'https://1.1.1.1/dns-query', name: 'Cloudflare-1' },
    { url: 'https://1.0.0.1/dns-query', name: 'Cloudflare-2' },
    { url: 'https://8.8.8.8/resolve', name: 'Google-1' },
    { url: 'https://8.8.4.4/resolve', name: 'Google-2' },
  ];

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
    this.maxRetries = parseInt(
      this.configService.get<string>('TMDB_MAX_RETRIES', '3'),
      10,
    );
    this.timeoutMs = parseInt(
      this.configService.get<string>('TMDB_TIMEOUT_MS', '15000'),
      10,
    );
    this.dnsCacheTtlMs =
      parseInt(
        this.configService.get<string>('TMDB_DNS_CACHE_TTL_SECONDS', '300'),
        10,
      ) * 1000;

    this.logger.log(
      `TMDB HTTP client configured: retries=${this.maxRetries}, timeout=${this.timeoutMs}ms, ` +
        `DoH endpoints=${this.dohEndpoints.map((e) => e.name).join(', ')}`,
    );
  }

  async onModuleInit() {
    // Pre-warm DNS cache so the first user request doesn't pay the resolution cost
    try {
      const addresses = await this.resolveViaDoH('api.themoviedb.org');
      this.logger.log(
        `Pre-resolved api.themoviedb.org via DoH → ${addresses.join(', ')}`,
      );
    } catch (err: any) {
      this.logger.warn(`DNS pre-warm failed: ${err.message}`);
    }
  }

  /**
   * Resolve a hostname to IPv4 addresses using DNS-over-HTTPS (DoH).
   * Tries multiple DoH providers (Cloudflare, Google) for redundancy.
   * This is the Node.js equivalent of Chrome's "Secure DNS" setting.
   */
  private async resolveViaDoH(hostname: string): Promise<string[]> {
    const cached = this.dnsCache.get(hostname);
    if (cached && cached.expiry > Date.now()) {
      return cached.addresses;
    }

    for (const endpoint of this.dohEndpoints) {
      try {
        const queryUrl = `${endpoint.url}?name=${encodeURIComponent(hostname)}&type=A`;
        const raw = await this.httpsGet(queryUrl, {
          Accept: 'application/dns-json',
        });

        const parsed: DoHResponse = JSON.parse(raw);

        if (parsed.Status !== 0) {
          this.logger.warn(
            `DoH ${endpoint.name} returned status ${parsed.Status} for ${hostname}`,
          );
          continue;
        }

        const addresses = (parsed.Answer || [])
          .filter((a) => a.type === 1) // type 1 = A record (IPv4)
          .map((a) => a.data);

        if (addresses.length > 0) {
          this.dnsCache.set(hostname, {
            addresses,
            expiry: Date.now() + this.dnsCacheTtlMs,
          });
          this.logger.debug(
            `DoH ${endpoint.name}: ${hostname} → ${addresses.join(', ')}`,
          );
          return addresses;
        }

        this.logger.warn(
          `DoH ${endpoint.name} returned no A records for ${hostname}`,
        );
      } catch (err: any) {
        this.logger.warn(
          `DoH ${endpoint.name} failed for ${hostname}: ${err.message}`,
        );
      }
    }

    throw new Error(
      `All DoH endpoints failed to resolve ${hostname}. ` +
        `Tried: ${this.dohEndpoints.map((e) => e.name).join(', ')}`,
    );
  }

  /**
   * Make a simple HTTPS GET request. Used for DoH queries (to IP addresses like 1.1.1.1)
   * and for the actual TMDB API calls (to resolved IPs with proper TLS SNI).
   */
  private httpsGet(
    url: string,
    headers: Record<string, string>,
    options?: { servername?: string; timeout?: number },
  ): Promise<string> {
    return new Promise((resolve, reject) => {
      const parsedUrl = new URL(url);
      const reqOptions: https.RequestOptions = {
        hostname: parsedUrl.hostname,
        port: 443,
        path: parsedUrl.pathname + parsedUrl.search,
        method: 'GET',
        headers: {
          ...headers,
          'User-Agent': 'PartyOS-Backend/1.0',
        },
        timeout: options?.timeout ?? 5000,
      };

      // If servername is provided, use it for TLS SNI and Host header
      // This is critical for connecting to a resolved IP while presenting
      // the correct hostname for certificate validation
      if (options?.servername) {
        reqOptions.servername = options.servername;
        reqOptions.headers = {
          ...reqOptions.headers,
          Host: options.servername,
        };
      }

      const req = https.get(reqOptions, (res) => {
        let data = '';
        res.on('data', (chunk: Buffer) => (data += chunk.toString()));
        res.on('end', () => {
          if (
            res.statusCode &&
            res.statusCode >= 200 &&
            res.statusCode < 300
          ) {
            resolve(data);
          } else {
            reject(
              new Error(
                `HTTPS ${res.statusCode}: ${data.substring(0, 200)}`,
              ),
            );
          }
        });
        res.on('error', reject);
      });

      req.on('error', (err) =>
        reject(new Error(`HTTPS request error: ${err.message}`)),
      );
      req.on('timeout', () => {
        req.destroy();
        reject(new Error(`HTTPS request timed out after ${reqOptions.timeout}ms`));
      });
    });
  }

  /**
   * Fetch JSON data from a TMDB API URL with:
   * - DNS-over-HTTPS resolution (Cloudflare/Google) to bypass ISP DNS blocking
   * - Direct HTTPS connection to the resolved IP with proper TLS SNI
   * - Automatic retry with exponential backoff
   * - Circuit breaker to prevent cascading failures
   */
  async fetch<T = any>(url: string): Promise<T> {
    // Circuit breaker: fail fast if too many recent failures
    if (Date.now() < this.circuitOpenUntil) {
      throw new HttpException(
        'TMDB API is temporarily unavailable. Please try again shortly.',
        HttpStatus.SERVICE_UNAVAILABLE,
      );
    }

    const parsedUrl = new URL(url);
    const originalHostname = parsedUrl.hostname;

    let lastError: Error = new Error('Unknown TMDB error');

    for (let attempt = 0; attempt <= this.maxRetries; attempt++) {
      try {
        // Step 1: Resolve hostname to IP via DoH
        const addresses = await this.resolveViaDoH(originalHostname);
        const ip =
          addresses[Math.floor(Math.random() * addresses.length)];

        // Step 2: Build URL with resolved IP instead of hostname
        const resolvedUrl = new URL(url);
        resolvedUrl.hostname = ip;

        // Step 3: Make HTTPS request to the IP with original hostname as TLS SNI
        const raw = await this.httpsGet(
          resolvedUrl.toString(),
          { Accept: 'application/json' },
          {
            servername: originalHostname,
            timeout: this.timeoutMs,
          },
        );

        const data = JSON.parse(raw) as T;

        // Reset circuit breaker on success
        this.consecutiveFailures = 0;
        return data;
      } catch (error: any) {
        lastError = error;

        // Don't retry client errors (4xx) except 429 rate limit
        if (error.message?.includes('HTTPS 4') && !error.message?.includes('HTTPS 429')) {
          throw new HttpException(
            `TMDB API error: ${error.message}`,
            HttpStatus.BAD_REQUEST,
          );
        }

        this.consecutiveFailures++;

        // Trip circuit breaker after threshold consecutive failures
        if (this.consecutiveFailures >= TmdbHttpService.CIRCUIT_THRESHOLD) {
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
      `All ${this.maxRetries + 1} TMDB fetch attempts exhausted. Last error: ${lastError.message}`,
    );
    throw new HttpException(
      'Unable to reach TMDB. The service may be temporarily unavailable in your region.',
      HttpStatus.SERVICE_UNAVAILABLE,
    );
  }
}
