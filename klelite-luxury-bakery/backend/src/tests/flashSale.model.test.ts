import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import FlashSale from '../models/FlashSale';
import Product from '../models/Product'; // Assuming Product model is needed for productId reference

let mongo: MongoMemoryServer;

describe('FlashSale Model Schema Validation', () => {
  jest.setTimeout(30000); // Set a higher timeout for these tests due to MongoMemoryServer
  beforeAll(async () => {
    mongo = await MongoMemoryServer.create();
    const uri = mongo.getUri();
    await mongoose.connect(uri);
  });

  afterEach(async () => {
    await FlashSale.deleteMany({});
  });

  afterAll(async () => {
    await mongoose.disconnect();
    await mongo.stop();
  });

  it('should create & save flash sale successfully with valid data', async () => {
    const productId = new mongoose.Types.ObjectId();
    const flashSaleData = {
      name: 'Test Flash Sale',
      startTime: new Date(Date.now() + 100000),
      endTime: new Date(Date.now() + 200000),
      products: [{
        productId: productId,
        flashPrice: 10,
        originalPrice: 20,
        stockLimit: 100,
        perUserLimit: 5,
      }],
      earlyAccessTiers: ['gold'],
      earlyAccessMinutes: 15,
    };

    const validFlashSale = new FlashSale(flashSaleData);
    const savedFlashSale = await validFlashSale.save();

    expect(savedFlashSale._id).toBeDefined();
    expect(savedFlashSale.name).toBe(flashSaleData.name);
    expect(savedFlashSale.slug).toBe('test-flash-sale');
    expect(savedFlashSale.startTime).toEqual(flashSaleData.startTime);
    expect(savedFlashSale.endTime).toEqual(flashSaleData.endTime);
    expect(savedFlashSale.status).toBe('scheduled');
    expect(savedFlashSale.products[0].productId).toEqual(productId);
    expect(savedFlashSale.products[0].flashPrice).toBe(10);
    expect(savedFlashSale.earlyAccessTiers).toEqual(['gold']);
  });

  it('should not save flash sale if required fields are missing', async () => {
    const flashSaleWithoutName = new FlashSale({
      startTime: new Date(),
      endTime: new Date(Date.now() + 1000),
      products: [],
    });
    await expect(flashSaleWithoutName.save()).rejects.toThrow(mongoose.Error.ValidationError);

    const flashSaleWithoutStartTime = new FlashSale({
      name: 'No Start Time',
      endTime: new Date(Date.now() + 1000),
      products: [],
    });
    await expect(flashSaleWithoutStartTime.save()).rejects.toThrow(mongoose.Error.ValidationError);

    const flashSaleWithoutEndTime = new FlashSale({
      name: 'No End Time',
      startTime: new Date(),
      products: [],
    });
    await expect(flashSaleWithoutEndTime.save()).rejects.toThrow(mongoose.Error.ValidationError);
  });

  it('should fail if endTime is not after startTime', async () => {
    const productId = new mongoose.Types.ObjectId();
    const flashSaleData = {
      name: 'Invalid Time',
      startTime: new Date(Date.now() + 100000),
      endTime: new Date(Date.now() + 50000), // endTime before startTime
      products: [{
        productId: productId,
        flashPrice: 10,
        originalPrice: 20,
        stockLimit: 100,
        perUserLimit: 5,
      }],
    };

    const invalidFlashSale = new FlashSale(flashSaleData);
    await expect(invalidFlashSale.save()).rejects.toThrow('End time must be after start time');
  });

  it('should fail if products array is empty', async () => {
    const flashSaleData = {
      name: 'No Products',
      startTime: new Date(),
      endTime: new Date(Date.now() + 1000),
      products: [],
    };

    const invalidFlashSale = new FlashSale(flashSaleData);
    await expect(invalidFlashSale.save()).rejects.toThrow('At least one product is required');
  });

  it('should fail if earlyAccessTiers contains invalid values', async () => {
    const productId = new mongoose.Types.ObjectId();
    const flashSaleData = {
      name: 'Invalid Tiers',
      startTime: new Date(),
      endTime: new Date(Date.now() + 1000),
      products: [{
        productId: productId,
        flashPrice: 10,
        originalPrice: 20,
        stockLimit: 100,
        perUserLimit: 5,
      }],
      earlyAccessTiers: ['invalid_tier'],
    };

    const invalidFlashSale = new FlashSale(flashSaleData);
    await expect(invalidFlashSale.save()).rejects.toThrow('Invalid tier: invalid_tier');
  });

  it('should generate slug from name if not provided', async () => {
    const productId = new mongoose.Types.ObjectId();
    const flashSaleData = {
      name: 'Another Test Sale',
      startTime: new Date(),
      endTime: new Date(Date.now() + 1000),
      products: [{
        productId: productId,
        flashPrice: 10,
        originalPrice: 20,
        stockLimit: 100,
        perUserLimit: 5,
      }],
    };

    const flashSale = new FlashSale(flashSaleData);
    const savedFlashSale = await flashSale.save();
    expect(savedFlashSale.slug).toBe('another-test-sale');
  });

  it('should not update slug if name is modified but slug already exists', async () => {
    const productId = new mongoose.Types.ObjectId();
    const flashSaleData = {
      name: 'Initial Name',
      startTime: new Date(),
      endTime: new Date(Date.now() + 1000),
      products: [{
        productId: productId,
        flashPrice: 10,
        originalPrice: 20,
        stockLimit: 100,
        perUserLimit: 5,
      }],
    };

    const flashSale = new FlashSale(flashSaleData);
    const savedFlashSale = await flashSale.save();
    expect(savedFlashSale.slug).toBe('initial-name');

    savedFlashSale.name = 'Updated Name';
    const updatedFlashSale = await savedFlashSale.save();
    expect(updatedFlashSale.slug).toBe('initial-name'); // Slug should not change
  });
});
