package com.mednexus.mednexus.config;

import java.net.http.HttpClient;
import java.security.SecureRandom;
import java.security.cert.X509Certificate;

import javax.net.ssl.SSLContext;
import javax.net.ssl.TrustManager;
import javax.net.ssl.X509TrustManager;

import com.google.api.client.http.javanet.NetHttpTransport;

public final class RelaxedSslSupport {

	private RelaxedSslSupport() {
	}

	public static HttpClient createHttpClient(boolean sslRelaxed) {
		HttpClient.Builder builder = HttpClient.newBuilder();
		if (sslRelaxed) {
			builder.sslContext(createTrustAllSslContext());
		}
		return builder.build();
	}

	public static NetHttpTransport createNetHttpTransport(boolean sslRelaxed) {
		if (!sslRelaxed) {
			return new NetHttpTransport();
		}
		try {
			return new NetHttpTransport.Builder().doNotValidateCertificate().build();
		} catch (Exception ex) {
			throw new IllegalStateException("Could not create relaxed NetHttpTransport.", ex);
		}
	}

	private static SSLContext createTrustAllSslContext() {
		try {
			TrustManager[] trustAll = new TrustManager[] {
				new X509TrustManager() {
					@Override
					public X509Certificate[] getAcceptedIssuers() {
						return new X509Certificate[0];
					}

					@Override
					public void checkClientTrusted(X509Certificate[] chain, String authType) {
					}

					@Override
					public void checkServerTrusted(X509Certificate[] chain, String authType) {
					}
				}
			};
			SSLContext context = SSLContext.getInstance("TLS");
			context.init(null, trustAll, new SecureRandom());
			return context;
		} catch (Exception ex) {
			throw new IllegalStateException("Could not create relaxed SSL context.", ex);
		}
	}
}
