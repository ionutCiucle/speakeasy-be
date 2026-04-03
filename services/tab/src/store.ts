import { PrismaClient } from "../prisma/client";
import { logger } from "./logger";

const prisma = new PrismaClient();

const tabInclude = {
  items: true,
  settlements: true,
  members: { include: { memberMenuItems: true } },
};

const findMenuItems = (tabId: string) =>
  prisma.menuItem.findMany({ where: { tabId } });

const withMenuItems = async <T extends { id: string }>(tab: T) => ({
  ...tab,
  menuItems: await findMenuItems(tab.id),
});

// Creates a new tab with initial members and menu items; creator is auto-added as a member.
export const createTab = async (
  createdById: string,
  data: {
    title: string;
    venue: string;
    currencyCode: string;
    currencyName: string;
    notes?: string;
    members: { userId: string }[];
    menuItems: { name: string; price: number }[];
  },
) => {
  logger.debug({ title: data.title, createdById }, "store: createTab");
  const allMembers = [
    { userId: createdById },
    ...data.members.filter((m) => m.userId !== createdById),
  ];
  try {
    const tab = await prisma.tab.create({
      data: {
        title: data.title,
        venue: data.venue,
        currencyCode: data.currencyCode,
        currencyName: data.currencyName,
        notes: data.notes,
        createdById,
        members: allMembers.length ? { create: allMembers } : undefined,
      },
      include: tabInclude,
    });
    if (data.menuItems.length) {
      await prisma.menuItem.createMany({
        data: data.menuItems.map((item) => ({
          ...item,
          tabId: tab.id,
          addedBy: createdById,
        })),
      });
    }
    return withMenuItems(tab);
  } catch (err) {
    logger.error(
      { err, title: data.title, createdById },
      "store: createTab failed",
    );
    throw err;
  }
};

// Returns all tabs ordered by creation date, newest first.
export const findAllTabs = async () => {
  logger.debug("store: findAllTabs");
  try {
    const tabs = await prisma.tab.findMany({
      include: tabInclude,
      orderBy: { createdAt: "desc" },
    });
    return Promise.all(tabs.map(withMenuItems));
  } catch (err) {
    logger.error({ err }, "store: findAllTabs failed");
    throw err;
  }
};

// Returns a single tab by ID, or null if not found.
export const findTabById = async (id: string) => {
  logger.debug({ id }, "store: findTabById");
  try {
    const tab = await prisma.tab.findUnique({
      where: { id },
      include: tabInclude,
    });
    return tab ? withMenuItems(tab) : null;
  } catch (err) {
    logger.error({ err, id }, "store: findTabById failed");
    throw err;
  }
};

export const addItems = async (
  tabId: string,
  items: { label: string; amount: number; addedBy: string }[],
) => {
  logger.debug({ tabId, count: items.length }, "store: addItems");
  try {
    return await prisma.item.createManyAndReturn({
      data: items.map((item) => ({ tabId, ...item })),
    });
  } catch (err) {
    logger.error({ err, tabId }, "store: addItems failed");
    throw err;
  }
};

export const findItemById = async (id: string) => {
  logger.debug({ id }, "store: findItemById");
  try {
    return await prisma.item.findUnique({ where: { id } });
  } catch (err) {
    logger.error({ err, id }, "store: findItemById failed");
    throw err;
  }
};

export const removeItem = async (id: string) => {
  logger.debug({ id }, "store: removeItem");
  try {
    return await prisma.item.delete({ where: { id } });
  } catch (err) {
    logger.error({ err, id }, "store: removeItem failed");
    throw err;
  }
};

export const addMember = async (tabId: string, userId: string) => {
  logger.debug({ tabId, userId }, "store: addMember");
  try {
    return await prisma.member.create({ data: { tabId, userId } });
  } catch (err) {
    logger.error({ err, tabId, userId }, "store: addMember failed");
    throw err;
  }
};

export const findMemberById = async (tabId: string, userId: string) => {
  logger.debug({ tabId, userId }, "store: findMemberById");
  try {
    return await prisma.member.findUnique({
      where: { tabId_userId: { tabId, userId } },
    });
  } catch (err) {
    logger.error({ err, tabId, userId }, "store: findMemberById failed");
    throw err;
  }
};

export const removeMember = async (tabId: string, userId: string) => {
  logger.debug({ tabId, userId }, "store: removeMember");
  try {
    return await prisma.member.delete({
      where: { tabId_userId: { tabId, userId } },
    });
  } catch (err) {
    logger.error({ err, tabId, userId }, "store: removeMember failed");
    throw err;
  }
};

export const updateTabMenuItems = async (
  tabId: string,
  addedBy: string,
  menuItems: { name: string; price: number }[],
) => {
  logger.debug({ tabId }, "store: updateTabMenuItems");
  try {
    const incoming = new Map(menuItems.map((item) => [item.name, item.price]));
    const existing = await prisma.menuItem.findMany({ where: { tabId } });
    const existingNames = new Map(existing.map((item) => [item.name, item]));

    const toDelete = existing.filter((item) => !incoming.has(item.name));
    const toCreate = menuItems.filter((item) => !existingNames.has(item.name));
    const toUpdate = menuItems.filter((item) => {
      const ex = existingNames.get(item.name);
      return ex && Number(ex.price) !== item.price;
    });

    await prisma.$transaction([
      ...toDelete.map((item) =>
        prisma.menuItem.delete({ where: { id: item.id } }),
      ),
      ...toCreate.map((item) =>
        prisma.menuItem.create({
          data: { tabId, name: item.name, price: item.price, addedBy },
        }),
      ),
      ...toUpdate.map((item) =>
        prisma.menuItem.update({
          where: { id: existingNames.get(item.name)!.id },
          data: { price: item.price },
        }),
      ),
    ]);

    return findTabById(tabId);
  } catch (err) {
    logger.error({ err, tabId }, "store: updateTabMenuItems failed");
    throw err;
  }
};

export const updateMemberItems = async (
  tabId: string,
  userId: string,
  items: { menuItemId: string; quantity: number }[],
) => {
  logger.debug({ tabId, userId }, "store: updateMemberItems");
  try {
    await prisma.$transaction([
      prisma.memberMenuItem.deleteMany({ where: { tabId, userId } }),
      prisma.memberMenuItem.createMany({
        data: items.map((item) => ({
          tabId,
          userId,
          menuItemId: item.menuItemId,
          quantity: item.quantity,
        })),
      }),
    ]);
    return prisma.member.findUnique({
      where: { tabId_userId: { tabId, userId } },
      include: { memberMenuItems: true },
    });
  } catch (err) {
    logger.error({ err, tabId, userId }, "store: updateMemberItems failed");
    throw err;
  }
};

export const recordSettlement = async (
  tabId: string,
  payerId: string,
  payeeId: string,
  amount: number,
) => {
  logger.debug({ tabId, payerId, payeeId }, "store: recordSettlement");
  try {
    return await prisma.settlement.create({
      data: { tabId, payerId, payeeId, amount },
    });
  } catch (err) {
    logger.error({ err, tabId }, "store: recordSettlement failed");
    throw err;
  }
};

export const closeTab = async (id: string) => {
  logger.debug({ id }, "store: closeTab");
  try {
    const tab = await prisma.tab.update({
      where: { id },
      data: { closedAt: new Date(), status: "closed" },
      include: tabInclude,
    });
    return withMenuItems(tab);
  } catch (err) {
    logger.error({ err, id }, "store: closeTab failed");
    throw err;
  }
};
