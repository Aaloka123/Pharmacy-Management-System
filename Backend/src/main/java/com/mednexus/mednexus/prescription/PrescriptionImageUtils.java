package com.mednexus.mednexus.prescription;

import java.awt.Graphics2D;
import java.awt.RenderingHints;
import java.awt.image.BufferedImage;
import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.io.InputStream;

import javax.imageio.ImageIO;

public final class PrescriptionImageUtils {

	private static final int MAX_DIMENSION = 1280;

	private PrescriptionImageUtils() {
	}

	public static byte[] prepareForOcr(InputStream input) throws IOException {
		BufferedImage original = ImageIO.read(input);
		if (original == null) {
			throw new IOException("Unsupported or unreadable image");
		}
		BufferedImage resized = resize(original, MAX_DIMENSION);
		ByteArrayOutputStream out = new ByteArrayOutputStream();
		ImageIO.write(toRgb(resized), "jpg", out);
		return out.toByteArray();
	}

	private static BufferedImage toRgb(BufferedImage image) {
		if (image.getType() == BufferedImage.TYPE_INT_RGB) {
			return image;
		}
		BufferedImage rgb = new BufferedImage(image.getWidth(), image.getHeight(), BufferedImage.TYPE_INT_RGB);
		Graphics2D graphics = rgb.createGraphics();
		graphics.drawImage(image, 0, 0, null);
		graphics.dispose();
		return rgb;
	}

	private static BufferedImage resize(BufferedImage image, int maxDimension) {
		int width = image.getWidth();
		int height = image.getHeight();
		if (width <= maxDimension && height <= maxDimension) {
			return image;
		}
		double scale = Math.min((double) maxDimension / width, (double) maxDimension / height);
		int newWidth = Math.max(1, (int) Math.round(width * scale));
		int newHeight = Math.max(1, (int) Math.round(height * scale));
		BufferedImage scaled = new BufferedImage(newWidth, newHeight, BufferedImage.TYPE_INT_RGB);
		Graphics2D graphics = scaled.createGraphics();
		graphics.setRenderingHint(RenderingHints.KEY_INTERPOLATION, RenderingHints.VALUE_INTERPOLATION_BILINEAR);
		graphics.drawImage(toRgb(image), 0, 0, newWidth, newHeight, null);
		graphics.dispose();
		return scaled;
	}
}
