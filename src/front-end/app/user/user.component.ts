import { Component } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { Subscription } from 'rxjs';
import { startsWith } from 'lodash';

import { IUser, IRepo, UserService } from '../.services';

@Component({
	selector: 'user',
	template: String(require('./user.jade')),
	styles: [String(require('./user.scss'))]
})
export class UserComponent {
	public user: IUser = {};
	public repos: IRepo[] = [];
	public loading:boolean = true;
	private routerEventsSubs: Subscription;

	constructor(
		private route: ActivatedRoute,
		private userService: UserService,
		private router: Router
	) {}

	private ngAfterContentInit() {

		this.routerEventsSubs = this.router.events
			.filter(res => startsWith(res.toString(), 'NavigationStart'))
			.subscribe(res => {
				this.loading = true;
			});

		this.userService
			.chunks$
			.then(() => {
				this.route.params.subscribe(params => {
					let username = params['id'];

					if (!(username in this.userService.users)) {
						this.router.navigate(['list', 1]);
						return;
					}

					this.userService.users[username].get()
						.then(user => {
							this.user = user;
							return user.repos$.get();
						})
						.then(repos => {
							this.repos = repos;
							this.loading = false;
						});
				});
			});
	}

	private ngOnDestroy():void {
		this.routerEventsSubs.unsubscribe();
	}
}