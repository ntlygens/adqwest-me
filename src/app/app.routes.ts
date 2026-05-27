import { NgModule } from '@angular/core';
import { RouterModule } from '@angular/router';
import { MainRouter_Face } from './i-faces';

export const Main_Routes: MainRouter_Face[] = [
    {
        path: '',
        loadChildren: () => import('./landing/landing-module')
        .then(
            m => m.LandingModule
        ),
        data: {
            state: 'landing',
            animation: 'isLeft'
        }

    }
];

@NgModule({
    exports: [RouterModule],
    imports: [RouterModule.forRoot(Main_Routes,
        {enableTracing: false})]
})
export class AMERoutingModule { }
