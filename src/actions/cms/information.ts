'use server';

import { prisma } from '@/lib/prisma';
import { getCurrentSessionUser } from '@/server/auth/session';
import { requireTenantMembership } from '@/lib/tenant';
import { revalidatePath } from 'next/cache';
import { uploadToCloudinary, deleteFromCloudinary } from '@/lib/cloudinary';
import { InformationType } from '@prisma/client';

function sanitizeFileName(name: string): string {
  return name
    .normalize('NFKD')
    .replace(/[^a-zA-Z0-9._-]/g, '_')
    .replace(/_+/g, '_')
    .replace(/^_+|_+$/g, '');
}

export async function createInformation(formData: FormData) {
  try {
    const session = await getCurrentSessionUser();
    if (!session?.id) {
      return { error: 'Unauthorized' };
    }

    const tenantId = formData.get('tenantId') as string;
    if (!tenantId) {
      return { error: 'Tenant ID required' };
    }

    await requireTenantMembership(session.id, tenantId);

    const title = (formData.get('title') as string)?.trim();
    const content = (formData.get('content') as string)?.trim();
    const type = formData.get('type') as InformationType;

    if (!title || !content) {
      return { error: 'Title and content are required' };
    }

    let mediaUrl: string | null = null;
    let mediaPublicId: string | null = null;

    const file = formData.get('file') as File | null;
    if (file && file.size > 0) {
      const bytes = await file.arrayBuffer();
      const buffer = Buffer.from(bytes);

      let resourceType: 'image' | 'video' | 'raw' = 'image';
      let folder = 'kalivergo/information/images';
      let publicId: string | undefined;
      let accessMode: 'public' | 'authenticated' | 'private' | undefined;

      if (type === InformationType.VIDEO) {
        resourceType = 'video';
        folder = 'kalivergo/information/videos';
      } else if (type === InformationType.PDF) {
        resourceType = 'raw';
        folder = 'kalivergo/information/pdfs';
        accessMode = 'public';
        const originalName = file.name || `document_${Date.now()}`;
        const baseName = originalName.replace(/\.[^/.]+$/, '');
        const ext = originalName.match(/\.[^/.]+$/)?.[0] || '.pdf';
        publicId = `${Date.now()}_${sanitizeFileName(baseName)}${ext}`;
      }

      const uploadResult = await uploadToCloudinary(buffer, {
        folder,
        resourceType,
        publicId,
        accessMode,
      });

      mediaUrl = uploadResult.secure_url;
      mediaPublicId = uploadResult.public_id;
    }

    const information = await prisma.information.create({
      data: {
        tenantId,
        userId: session.id,
        title,
        content,
        type,
        mediaUrl,
        mediaPublicId,
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            image: true,
          },
        },
        _count: {
          select: {
            comments: true,
            reactions: true,
          },
        },
      },
    });

    revalidatePath(`/${tenantId}/information`);
    return { success: true, data: information };
  } catch (error) {
    console.error('Error creating information:', error);
    return { error: 'Failed to create information' };
  }
}

export async function getInformationFeed(tenantId: string, cursor?: string, limit: number = 20) {
  try {
    const session = await getCurrentSessionUser();
    if (!session?.id) {
      return { error: 'Unauthorized' };
    }

    await requireTenantMembership(session.id, tenantId);

    const informations = await prisma.information.findMany({
      where: { tenantId },
      orderBy: { createdAt: 'desc' },
      take: limit + 1,
      cursor: cursor ? { id: cursor } : undefined,
      include: {
        user: {
          select: {
            id: true,
            name: true,
            image: true,
          },
        },
        comments: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                image: true,
              },
            },
            replies: {
              include: {
                user: {
                  select: {
                    id: true,
                    name: true,
                    image: true,
                  },
                },
              },
              orderBy: { createdAt: 'asc' },
            },
          },
          where: { parentId: null },
          orderBy: { createdAt: 'asc' },
        },
        reactions: {
          select: {
            type: true,
            userId: true,
          },
        },
        readMarks: {
          where: { userId: session.id },
          select: { readAt: true },
        },
        _count: {
          select: {
            comments: true,
            reactions: true,
          },
        },
      },
    });

    let nextCursor: string | undefined = undefined;
    if (informations.length > limit) {
      const nextItem = informations.pop();
      nextCursor = nextItem?.id;
    }

    const enrichedFeed = informations.map((info) => {
      const hasRead = info.readMarks.length > 0;
      const userReaction = info.reactions.find((r) => r.userId === session.id);

      const reactionCounts = info.reactions.reduce(
        (acc, r) => {
          acc[r.type] = (acc[r.type] || 0) + 1;
          return acc;
        },
        {} as Record<string, number>
      );

      return {
        ...info,
        hasRead,
        userReaction: userReaction?.type || null,
        reactionCounts,
      };
    });

    return { success: true, data: enrichedFeed, nextCursor };
  } catch (error) {
    console.error('Error fetching information feed:', error);
    return { error: 'Failed to fetch information feed' };
  }
}

export async function markAsRead(informationId: string) {
  try {
    const session = await getCurrentSessionUser();
    if (!session?.id) {
      return { error: 'Unauthorized' };
    }

    const information = await prisma.information.findUnique({
      where: { id: informationId },
      select: { tenantId: true },
    });

    if (!information) {
      return { error: 'Information not found' };
    }

    await requireTenantMembership(session.id, information.tenantId);

    await prisma.readMark.upsert({
      where: {
        informationId_userId: {
          informationId,
          userId: session.id,
        },
      },
      update: { readAt: new Date() },
      create: {
        informationId,
        userId: session.id,
      },
    });

    return { success: true };
  } catch (error) {
    console.error('Error marking as read:', error);
    return { error: 'Failed to mark as read' };
  }
}

export async function addComment(informationId: string, content: string, parentId?: string) {
  try {
    const session = await getCurrentSessionUser();
    if (!session?.id) {
      return { error: 'Unauthorized' };
    }

    const information = await prisma.information.findUnique({
      where: { id: informationId },
      select: { tenantId: true },
    });

    if (!information) {
      return { error: 'Information not found' };
    }

    await requireTenantMembership(session.id, information.tenantId);

    const comment = await prisma.comment.create({
      data: {
        informationId,
        userId: session.id,
        content,
        parentId: parentId || null,
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            image: true,
          },
        },
        replies: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                image: true,
              },
            },
          },
        },
      },
    });

    revalidatePath(`/${information.tenantId}/information`);
    return { success: true, data: comment };
  } catch (error) {
    console.error('Error adding comment:', error);
    return { error: 'Failed to add comment' };
  }
}

export async function addReaction(informationId: string, type: string) {
  try {
    const session = await getCurrentSessionUser();
    if (!session?.id) {
      return { error: 'Unauthorized' };
    }

    const information = await prisma.information.findUnique({
      where: { id: informationId },
      select: { tenantId: true },
    });

    if (!information) {
      return { error: 'Information not found' };
    }

    await requireTenantMembership(session.id, information.tenantId);

    await prisma.reaction.upsert({
      where: {
        informationId_userId: {
          informationId,
          userId: session.id,
        },
      },
      update: { type: type as any },
      create: {
        informationId,
        userId: session.id,
        type: type as any,
      },
    });

    revalidatePath(`/${information.tenantId}/information`);
    return { success: true };
  } catch (error) {
    console.error('Error adding reaction:', error);
    return { error: 'Failed to add reaction' };
  }
}

export async function removeReaction(informationId: string) {
  try {
    const session = await getCurrentSessionUser();
    if (!session?.id) {
      return { error: 'Unauthorized' };
    }

    const information = await prisma.information.findUnique({
      where: { id: informationId },
      select: { tenantId: true },
    });

    if (!information) {
      return { error: 'Information not found' };
    }

    await requireTenantMembership(session.id, information.tenantId);

    await prisma.reaction.deleteMany({
      where: {
        informationId,
        userId: session.id,
      },
    });

    revalidatePath(`/${information.tenantId}/information`);
    return { success: true };
  } catch (error) {
    console.error('Error removing reaction:', error);
    return { error: 'Failed to remove reaction' };
  }
}

export async function deleteInformation(informationId: string) {
  try {
    const session = await getCurrentSessionUser();
    if (!session?.id) {
      return { error: 'Unauthorized' };
    }

    const information = await prisma.information.findUnique({
      where: { id: informationId },
      select: { tenantId: true, userId: true, mediaPublicId: true, type: true },
    });

    if (!information) {
      return { error: 'Information not found' };
    }

    await requireTenantMembership(session.id, information.tenantId);

    if (information.userId !== session.id) {
      const membership = await prisma.tenantMembership.findFirst({
        where: { userId: session.id, tenantId: information.tenantId },
      });
      if (!membership || membership.role !== 'OWNER') {
        return { error: 'Unauthorized to delete this information' };
      }
    }

    if (information.mediaPublicId) {
      let resourceType: 'image' | 'video' | 'raw' = 'image';
      if (information.type === 'VIDEO') {
        resourceType = 'video';
      } else if (information.type === 'PDF') {
        resourceType = 'raw';
      }
      await deleteFromCloudinary(information.mediaPublicId, resourceType);
    }

    await prisma.information.delete({
      where: { id: informationId },
    });

    revalidatePath(`/${information.tenantId}/information`);
    revalidatePath(`/${information.tenantId}/cms/information`);
    return { success: true };
  } catch (error) {
    console.error('Error deleting information:', error);
    return { error: 'Failed to delete information' };
  }
}

export async function getCmsInformation(tenantId: string) {
  try {
    const session = await getCurrentSessionUser();
    if (!session?.id) {
      return { error: 'Unauthorized' };
    }

    await requireTenantMembership(session.id, tenantId);

    const informations = await prisma.information.findMany({
      where: { tenantId },
      orderBy: { createdAt: 'desc' },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            image: true,
          },
        },
        readMarks: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                image: true,
              },
            },
          },
          orderBy: { readAt: 'desc' },
        },
        _count: {
          select: {
            comments: true,
            reactions: true,
            readMarks: true,
          },
        },
      },
    });

    return { success: true, data: informations };
  } catch (error) {
    console.error('Error fetching CMS information:', error);
    return { error: 'Failed to fetch information' };
  }
}
