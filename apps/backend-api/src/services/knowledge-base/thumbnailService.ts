import sharp from "sharp";

interface ThumbnailOptions {
  width: number;
  height: number;
  quality: number;
  format: "jpeg" | "png" | "webp";
}

export class ThumbnailService {
  private defaultOptions: ThumbnailOptions = {
    width: 200,
    height: 200,
    quality: 80,
    format: "jpeg",
  };

  async generateImageThumbnail(
    sourceBuffer: Buffer,
    options: Partial<ThumbnailOptions> = {}
  ): Promise<Buffer> {
    const opts = { ...this.defaultOptions, ...options };

    try {
      let sharpInstance = sharp(sourceBuffer)
        .resize(opts.width, opts.height, {
          fit: "cover",
          position: "center",
        });

      switch (opts.format) {
        case "jpeg":
          sharpInstance = sharpInstance.jpeg({ quality: opts.quality });
          break;
        case "png":
          sharpInstance = sharpInstance.png({ quality: opts.quality });
          break;
        case "webp":
          sharpInstance = sharpInstance.webp({ quality: opts.quality });
          break;
      }

      return await sharpInstance.toBuffer();
    } catch (error) {
      console.error("Image thumbnail generation error:", error);
      throw new Error(`Failed to generate image thumbnail: ${error}`);
    }
  }

  async generatePDFThumbnail(
    sourceBuffer: Buffer,
    page: number = 1
  ): Promise<Buffer> {
    try {
      // For PDF thumbnails, we'd typically use libraries like pdf-poppler or pdf2pic
      // For now, we'll create a simple placeholder thumbnail
      return await this.createPlaceholderThumbnail("PDF", "#E53E3E");
    } catch (error) {
      console.error("PDF thumbnail generation error:", error);
      throw new Error(`Failed to generate PDF thumbnail: ${error}`);
    }
  }

  async generateVideoThumbnail(
    sourceUrl: string,
    timeOffset: number = 0
  ): Promise<Buffer> {
    try {
      // For video thumbnails, we'd typically use ffmpeg
      // For now, we'll create a simple placeholder thumbnail
      return await this.createPlaceholderThumbnail("VIDEO", "#3182CE");
    } catch (error) {
      console.error("Video thumbnail generation error:", error);
      throw new Error(`Failed to generate video thumbnail: ${error}`);
    }
  }

  async generateDocumentThumbnail(mimeType: string): Promise<Buffer> {
    try {
      let label = "DOC";
      let color = "#38A169";

      if (mimeType.includes("pdf")) {
        label = "PDF";
        color = "#E53E3E";
      } else if (mimeType.includes("word") || mimeType.includes("document")) {
        label = "DOC";
        color = "#2B6CB0";
      } else if (mimeType.includes("sheet") || mimeType.includes("excel")) {
        label = "XLS";
        color = "#38A169";
      } else if (mimeType.includes("presentation") || mimeType.includes("powerpoint")) {
        label = "PPT";
        color = "#D69E2E";
      }

      return await this.createPlaceholderThumbnail(label, color);
    } catch (error) {
      console.error("Document thumbnail generation error:", error);
      throw new Error(`Failed to generate document thumbnail: ${error}`);
    }
  }

  private async createPlaceholderThumbnail(
    text: string,
    backgroundColor: string = "#4A5568"
  ): Promise<Buffer> {
    try {
      const svg = `
        <svg width="200" height="200" xmlns="http://www.w3.org/2000/svg">
          <rect width="200" height="200" fill="${backgroundColor}" rx="8"/>
          <text x="100" y="110" font-family="Arial, sans-serif" font-size="24" 
                font-weight="bold" text-anchor="middle" fill="white">${text}</text>
        </svg>
      `;

      return await sharp(Buffer.from(svg))
        .png()
        .toBuffer();
    } catch (error) {
      console.error("Placeholder thumbnail creation error:", error);
      throw new Error(`Failed to create placeholder thumbnail: ${error}`);
    }
  }

  async generateThumbnailByMimeType(
    sourceBuffer: Buffer,
    mimeType: string,
    options: Partial<ThumbnailOptions> = {}
  ): Promise<Buffer> {
    try {
      if (mimeType.startsWith("image/")) {
        return await this.generateImageThumbnail(sourceBuffer, options);
      } else if (mimeType === "application/pdf") {
        return await this.generatePDFThumbnail(sourceBuffer);
      } else if (mimeType.startsWith("video/")) {
        // Note: This would need the actual file URL or path for video processing
        return await this.generateVideoThumbnail("");
      } else {
        return await this.generateDocumentThumbnail(mimeType);
      }
    } catch (error) {
      console.error("Thumbnail generation error:", error);
      // Return a generic placeholder if thumbnail generation fails
      return await this.createPlaceholderThumbnail("FILE", "#718096");
    }
  }

  getOptimalThumbnailFormat(mimeType: string): "jpeg" | "png" | "webp" {
    if (mimeType.includes("png") || mimeType.includes("gif")) {
      return "png"; // Preserve transparency
    }
    return "jpeg"; // Default for photographs and most images
  }

  getThumbnailSizes() {
    return {
      small: { width: 64, height: 64 },
      medium: { width: 128, height: 128 },
      large: { width: 200, height: 200 },
      xlarge: { width: 400, height: 400 },
    };
  }
}