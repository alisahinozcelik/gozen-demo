/// <reference path="../../front-end.d.ts" />

import { Component } from '@angular/core';
import { Router, ActivatedRoute, NavigationStart } from '@angular/router';
import { chunk, range, map, startsWith } from 'lodash';
import { Subscription } from 'rxjs';

import { Request, HttpGenerator, UserService, IUser } from '../.services';

@Component({
	selector: 'user-list',
	template: String(require('./user-list.jade')),
	styles: [String(require('./user-list.scss'))]
})
export class UserListComponent {
	public users: IUser[] = [];
	public pageId:number = 1;
	public pageCount:number[];
	public loading: boolean = true;
	private routeEventsSubs: Subscription;

	constructor(
		private userService: UserService,
		private router: Router,
		private route: ActivatedRoute
		) {
	}

	private ngAfterContentInit() {
		this.pageCount = map(range(this.userService.userLimit / this.userService.chunkSize), el => el + 1);

		this.routeEventsSubs = this.router.events
			.filter(res => startsWith(res.toString(), 'NavigationStart'))
			.subscribe(res => {
				this.loading = true;
				this.users = [];
			});

		this.route.params.subscribe(res => {

			if (res['page'] && +res['page'] > 0 && +res['page'] <= this.userService.chunkSize) {
				this.pageId = +res['page'];
			}
			else {
				this.router.navigate(['list', 1]);
				return;
			}

			this.setUsers();
		});
	}

	private ngOnDestroy():void {
		this.routeEventsSubs.unsubscribe();
	}

	private setUsers():void {
		this.userService.chunks$
			.then(res => {
				return res[this.pageId - 1].get()
			})
			.then(users => {
				this.users = users;
				this.loading = false;
			});
	}

	public replaceUser(i:number):void {
		this.userService.chunks$
			.then(res => {
				let newUser = this.userService.buffer.shift();
				this.userService.fillBuffer();

				res[this.pageId - 1].change(i, newUser);
				
				newUser.get()
					.then(user => {
						this.userService.users[user.login] = newUser;
						this.setUsers();
					});
		});
	}

	public navigate(e:Event, operand:number):void {
		e.preventDefault();
		this.router.navigate(['list', this.pageId + operand]);
	}
}