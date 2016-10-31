import { Injectable } from '@angular/core';
import { slice, last, map, forEach, chunk, every } from 'lodash';
import { Subject, AsyncSubject, BehaviorSubject } from 'rxjs';

import { Request, HttpGenerator, ColdPromise, ColdPromiseAll } from './index';


interface IUserRaw {
	id?: number;
	avatar_url?: string;
	login?: string;
}

export interface IRepo {
	name?: string;
	language?: string;
	stargazers_count?: number;
}

export interface IUser extends IUserRaw {
	email?: string;
	name?: string;
	followers?: number;
	repos$?: ColdPromise<IRepo[]>;
}

@Injectable()
export class UserService {
	private service: HttpGenerator;
	private lastIndex: number = 0;
	public userLimit: number = 100;
	public chunkSize: number = 10;
	private rawUsers: IUserRaw[] = [];
	public chunks$: Promise<ColdPromiseAll<IUser>[]>;
	private chunks$Resolve: (paramToResolve:ColdPromiseAll<IUser>[])=>void;
	public users: {[key: string]: ColdPromise<IUser>} = {};
	public buffer: ColdPromise<IUser>[] = [];

	constructor(service:Request) {
		this.service = service.http.changeHost('https://api.github.com/');
		this.chunks$ = new Promise<ColdPromiseAll<IUser>[]>(resolve => {
			this.chunks$Resolve = resolve;
		});
		this.getAllUsers();
	}

	private getAllUsers(index:number = this.lastIndex):void {
		
		this.service.get<IUserRaw[]>(`users?since=${index}`)
			.subscribe(res => {
				this.rawUsers.push(...res);
				this.lastIndex = last(this.rawUsers).id;

				if (this.rawUsers.length < this.userLimit) {
					this.getAllUsers();
				}
				else {
					let mappedUsers:ColdPromise<IUser>[];
					let chunks:ColdPromise<IUser>[][];
					const chunkArrayToResolve: ColdPromiseAll<IUser>[] = [];
					let buffer = slice(this.rawUsers, this.userLimit);
					this.rawUsers = slice(this.rawUsers, 0, this.userLimit);

					this.buffer = buffer.map(user => this.userMapper(user));
					this.fillBuffer();

					mappedUsers = this.rawUsers.map(user => this.userMapper(user));
					chunks = chunk<ColdPromise<IUser>>(mappedUsers, this.chunkSize);

					this.rawUsers.forEach((rawUser, index) => {
						this.users[rawUser.login] = mappedUsers[index];
					});

					chunks.forEach(chunk => {
						const promises:ColdPromise<IUser>[] = [];
						chunk.forEach(user => {
							promises.push(user);
						});
						chunkArrayToResolve.push(new ColdPromiseAll<IUser>(promises));
					});

					this.chunks$Resolve(chunkArrayToResolve);
				}
			});
	}

	public fillBuffer():void {

		if (this.buffer.length < 10) {
			this.service.get<IUserRaw[]>(`users?since=${this.lastIndex}`)
				.subscribe(res => {
					this.lastIndex = last(res).id;
					this.buffer.push(...res.map(user => this.userMapper(user)));
				});
		}
	}

	private userMapper(rawUser:IUserRaw):ColdPromise<IUser> {
		return new ColdPromise<IUser>(this.service.get<IUser>(`user/${rawUser.id}`).share())
			.map(user => {
				user.repos$ = new ColdPromise<IRepo[]>(this.service.get<IRepo[]>(`users/${user.login}/repos`).share());
				user.repos$.map(repos => {
					repos = slice(repos, 0, 10);
					return repos;
				});
				return user;
			});
	}
}