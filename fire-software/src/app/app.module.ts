import {NgModule} from '@angular/core';
import {BrowserModule} from '@angular/platform-browser';

import {AppRoutingModule} from './app-routing.module';
import {AppComponent} from './app.component';
import {CarteComponent} from './components/carte/carte.component';
import {HttpClientModule} from "@angular/common/http";
import {TruckComponent} from "./truck/truck.component";

@NgModule({
  declarations: [
    AppComponent,
    CarteComponent,
    TruckComponent
  ],
  imports: [
    BrowserModule,
    AppRoutingModule,
    HttpClientModule
  ],
  providers: [],
  bootstrap: [AppComponent]
})
export class AppModule {
}
