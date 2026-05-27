export enum Main_Pages {
    LANDING = 'landing' as any,
    HOME = 'home' as any,
    ABOUT = 'about' as any,
    CONTACT = 'contact' as any,
}

export interface MainRouter_Face {
    title?: string;
    redirectTo?: string;
    loadChildren?: any;
    pathMatch?: any;
    path: string;
    component?: any;
    data?: {
        state: string;
        animation: string;
        mobile?: any;
    };
    children?: any;
    outlets?: any;
    outlet?: string;
    formType?: Main_Pages;
}

