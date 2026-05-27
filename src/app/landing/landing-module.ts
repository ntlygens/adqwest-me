import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { LandingPg } from './landing-pg';
import { LandingRoutingModule } from './landing-routing-module';

@NgModule({
  declarations: [
    LandingPg
  ],
  imports: [CommonModule, LandingRoutingModule],
})
export class LandingModule {}
