import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { RouterModule } from '@angular/router';
import { HttpModule } from '@angular/http';

import { Request, UserService } from './.services';

import { AppComponent } from './app.component';
import { UserListComponent } from './user-list';
import { UserComponent } from './user';

@NgModule({
	imports: [
		BrowserModule,
		HttpModule,
		RouterModule.forRoot([
			{path: '', redirectTo: 'list/1', pathMatch: 'full'},
			{path: 'list', redirectTo: 'list/1', pathMatch: 'full'},
			{path: 'list/:page', component: UserListComponent},
			{path: 'user', redirectTo: 'list/1', pathMatch: 'full'},
			{path: 'user/:id', component: UserComponent}
		], {useHash: false})
	],
	providers: [Request, UserService],
	declarations: [AppComponent, UserListComponent, UserComponent],
	bootstrap: [AppComponent]
})
export class AppModule {}