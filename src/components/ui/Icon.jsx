import React from 'react';
import * as LucideIcons from 'lucide-react';

export const Icon = ({ name, size = 20, className = "" }) => {
    if (!name) return null;

    // Convert kebab-case to PascalCase (e.g. "alert-triangle" -> "AlertTriangle")
    const pascalName = name
        .split('-')
        .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
        .join('');

    const IconComponent = LucideIcons[pascalName];

    if (!IconComponent) {
        console.warn(`Icon "${name}" not found (converted to "${pascalName}")`);
        // Fallback
        const Help = LucideIcons.HelpCircle;
        return <Help size={size} className={className} />;
    }

    return <IconComponent size={size} className={className} />;
};
