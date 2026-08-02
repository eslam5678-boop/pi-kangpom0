import { FarmInventory, ResourceType } from '@/lib/types';

/**
 * إنشاء مخزن فارغ
 */
export function createInventory(): FarmInventory {
  return {
    items: [],
  };
}

/**
 * معرفة كمية مورد معين
 */
export function getItemAmount(
  inventory: FarmInventory,
  resource: ResourceType
): number {
  const item = inventory.items.find((i) => i.id === resource);

  return item ? item.amount : 0;
}

/**
 * هل يوجد كمية كافية؟
 */
export function hasItem(
  inventory: FarmInventory,
  resource: ResourceType,
  amount: number
): boolean {
  return getItemAmount(inventory, resource) >= amount;
}

/**
 * إضافة مورد
 */
export function addItem(
  inventory: FarmInventory,
  resource: ResourceType,
  amount: number
): FarmInventory {
  const items = [...inventory.items];

  const index = items.findIndex((i) => i.id === resource);

  if (index === -1) {
    items.push({
      id: resource,
      amount,
    });
  } else {
    items[index] = {
      ...items[index],
      amount: items[index].amount + amount,
    };
  }

  return {
    items,
  };
}

/**
 * حذف مورد
 */
export function removeItem(
  inventory: FarmInventory,
  resource: ResourceType,
  amount: number
): FarmInventory {
  const items = [...inventory.items];

  const index = items.findIndex((i) => i.id === resource);

  if (index === -1) {
    return inventory;
  }

  const remaining = items[index].amount - amount;

  if (remaining <= 0) {
    items.splice(index, 1);
  } else {
    items[index] = {
      ...items[index],
      amount: remaining,
    };
  }

  return {
    items,
  };
}

/**
 * تفريغ المخزن
 */
export function clearInventory(): FarmInventory {
  return {
    items: [],
  };
}