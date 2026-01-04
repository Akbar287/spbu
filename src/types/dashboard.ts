import React from 'react';

/**
 * Dashboard Types
 * Contains all types and interfaces used in the dashboard component
 */

// Role types available in the system
export type RoleType = 'admin' | 'direktur' | 'komisaris' | 'partner' | 'operator' | 'security' | 'officeboy';

// Menu item interface for individual menu items
export interface MenuItem {
    id: string;
    title: string;
    icon: React.ElementType;
    path: string;
    description?: string;
    color: string;
}

// Menu category interface for grouping menu items
export interface MenuCategory {
    id: string;
    title: string;
    description: string;
    icon: React.ElementType;
    items: MenuItem[];
    color: string;
}

// Role-based access configuration type
export type RoleMenuAccessConfig = Record<RoleType, string[]>;

// Role display names type
export type RoleNamesConfig = Record<RoleType, string>;
