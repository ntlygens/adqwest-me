import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { LandingPg } from './landing-pg';

const routes: Routes = [
  {
    path: '',
    component: LandingPg
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class LandingRoutingModule {}
