import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';

/**
 * Register a mobile device for push notifications
 * This endpoint stores the Expo push token for a user's device
 */
export async function POST(req: NextRequest) {
  try {
    const { userId, pushToken, platform } = await req.json();

    if (!userId || !pushToken) {
      return NextResponse.json(
        { success: false, error: 'userId and pushToken are required' },
        { status: 400 }
      );
    }

    if (!platform || !['ios', 'android'].includes(platform)) {
      return NextResponse.json(
        { success: false, error: 'Valid platform (ios/android) is required' },
        { status: 400 }
      );
    }

    // Check if this device token already exists for this user
    const existingDevice = await prisma.pushNotificationDevice.findFirst({
      where: {
        userId,
        pushToken,
      },
    });

    if (existingDevice) {
      // Update the existing device record
      await prisma.pushNotificationDevice.update({
        where: { id: existingDevice.id },
        data: {
          platform,
          lastActiveAt: new Date(),
        },
      });

      return NextResponse.json({
        success: true,
        message: 'Device updated successfully',
      });
    }

    // Create new device registration
    await prisma.pushNotificationDevice.create({
      data: {
        userId,
        pushToken,
        platform,
        lastActiveAt: new Date(),
      },
    });

    return NextResponse.json({
      success: true,
      message: 'Device registered successfully',
    });
  } catch (error) {
    console.error('Push notification device registration error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to register device' },
      { status: 500 }
    );
  }
}

/**
 * Delete a device registration
 */
export async function DELETE(req: NextRequest) {
  try {
    const { userId, pushToken } = await req.json();

    if (!userId || !pushToken) {
      return NextResponse.json(
        { success: false, error: 'userId and pushToken are required' },
        { status: 400 }
      );
    }

    await prisma.pushNotificationDevice.deleteMany({
      where: {
        userId,
        pushToken,
      },
    });

    return NextResponse.json({
      success: true,
      message: 'Device unregistered successfully',
    });
  } catch (error) {
    console.error('Push notification device deletion error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to unregister device' },
      { status: 500 }
    );
  }
}
