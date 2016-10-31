import { Observable } from 'rxjs';
import { map } from 'lodash';

export class ColdPromise<T> {
	private initialized:boolean = false;
	private promise$: Promise<T>;
	private operationsToDo: Array<(param:T)=>T> = [];

	constructor(private obs: Observable<T> | ColdPromise<T> | Promise<T>) {}
	
	public get():Promise<T> {
		if (!this.initialized) {
			this.initialized = true;
			this.promise$ = new Promise<T>((resolve, reject) => {

				let promise$:Promise<T>;

				if (this.obs instanceof Observable) {
					promise$ = this.obs.toPromise();
				}
				else if (this.obs instanceof ColdPromise) {
					promise$ = this.obs.get();
				}
				else if (this.obs instanceof Promise) {
					promise$ = this.obs;
				}

				promise$.then(res => {
					this.operationsToDo.forEach(func => {
						res = func.call(null, res);
					});
					resolve(res);
				});
			});
		}

		return this.promise$;
	}

	public map(func:(param:T)=>T):ColdPromise<T> {
		this.operationsToDo.push(func);
		return this;
	}
}

export class ColdPromiseAll<T> {
	private initialized:boolean = false;
	private promise$: Promise<T[]>;

	constructor(private arrayOfPromises:ColdPromise<T>[]) {}

	public get():Promise<T[]> {
		if (!this.initialized) {
			this.initialized = true;

			this.promise$ = new ColdPromise(Promise.all(map(this.arrayOfPromises, el => el.get()))).get();
		}

		return this.promise$;
	}

	public change(index:number, value:ColdPromise<T>):ColdPromiseAll<T> {
		this.initialized = false;
		this.arrayOfPromises[index] = value;

		return this;
	}
}