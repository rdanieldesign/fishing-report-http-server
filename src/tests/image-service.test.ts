import {
  getSignedImageUrl,
  deleteSingleImage,
  deleteMultipleImages,
} from "../services/image-service";
import { S3Client } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

jest.mock("@aws-sdk/client-s3");
jest.mock("@aws-sdk/s3-request-presigner");

const mockS3Client = S3Client as jest.MockedClass<typeof S3Client>;
const mockGetSignedUrl = getSignedUrl as jest.MockedFunction<
  typeof getSignedUrl
>;

describe("Image Service", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("getSignedImageUrl", () => {
    it("calls getSignedUrl with the correct bucket and key", async () => {
      mockGetSignedUrl.mockResolvedValueOnce("https://signed-url.example.com");

      const url = await getSignedImageUrl("test-key");

      expect(mockGetSignedUrl).toHaveBeenCalled();
      expect(url).toBe("https://signed-url.example.com");
    });
  });

  describe("deleteSingleImage", () => {
    it("sends a DeleteObjectCommand for the correct key", async () => {
      const mockSend = jest.fn().mockResolvedValueOnce({});
      mockS3Client.prototype.send = mockSend;

      await deleteSingleImage("test-key");

      expect(mockSend).toHaveBeenCalledWith(expect.any(Object));
    });
  });

  describe("deleteMultipleImages", () => {
    it("sends a DeleteObjectsCommand with all keys", async () => {
      const mockSend = jest.fn().mockResolvedValueOnce({});
      mockS3Client.prototype.send = mockSend;

      await deleteMultipleImages(["key1", "key2"]);

      expect(mockSend).toHaveBeenCalledWith(expect.any(Object));
    });
  });
});
