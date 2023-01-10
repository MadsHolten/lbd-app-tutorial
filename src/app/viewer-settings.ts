import { SelectionMode, ViewerSettings } from "ngx-lbd-components";

export function getViewerSettings(): ViewerSettings{
    const settings = new ViewerSettings();
    settings.selectionMode = SelectionMode.SINGLE;
    return settings;
}