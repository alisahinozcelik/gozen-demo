import { Component } from '@angular/core';

@Component({
	selector: 'app',
	template: `
		<header id="header"></header>
		<main>
			<router-outlet></router-outlet>
		</main>
		<footer id="footer"></footer>
	`,
	styles: [
		String(require('bootstrap/dist/css/bootstrap.css'))
	]
})
export class AppComponent {}