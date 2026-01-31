import type { NavigationPage, RipplingDepartment } from "@/utils/supabase/types";
import { slugify } from "@/utils/slugify";

/**
 * Get the URL slug for a department from NavigationPage config.
 * Falls back to slugified department name if not found.
 */
export const getDepartmentSlug = (
    departmentId: string,
    departments: RipplingDepartment[],
    navigationPages: NavigationPage[]
): string => {
    // Find the department
    const department = departments.find((d) => d.id === departmentId);
    if (!department) return departmentId; // Fallback to ID if department not found

    // Find the navigation page by matching slugified department name
    const deptSlug = slugify(department.name);
    const navPage = navigationPages.find((page) => page.slug === deptSlug);

    // Return the navigation page slug if found, otherwise the slugified department name
    return navPage?.slug ?? deptSlug;
};

/**
 * Get the department ID from a URL slug.
 * Returns null if no matching department is found.
 */
export const getDepartmentIdFromSlug = (
    slug: string,
    departments: RipplingDepartment[],
    navigationPages: NavigationPage[]
): string | null => {
    // First, try to find a navigation page with this exact slug
    const navPage = navigationPages.find((page) => page.slug === slug);
    if (navPage) {
        return navPage.department_id;
    }

    // Fallback: try to match against slugified department names
    const department = departments.find((dept) => slugify(dept.name) === slug);
    if (department) {
        return department.id;
    }

    return null;
};

/**
 * Build a full URL path using department slug instead of ID.
 * Example: buildDepartmentUrl("abc123", ["sis-tools", "subdomain-manager"], ...) => "/sis/sis-tools/subdomain-manager"
 */
export const buildDepartmentUrl = (
    departmentId: string,
    pathSegments: string[],
    departments: RipplingDepartment[],
    navigationPages: NavigationPage[]
): string => {
    const slug = getDepartmentSlug(departmentId, departments, navigationPages);
    const pathPart = pathSegments.length > 0 ? `/${pathSegments.join("/")}` : "";
    return `/${slug}${pathPart}`;
};
