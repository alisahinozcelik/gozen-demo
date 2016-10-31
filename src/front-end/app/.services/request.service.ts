/// <reference path="../../front-end.d.ts" />

import { Injectable, Inject } from '@angular/core';
import * as Http from '@angular/http';
import { Observable, Subject, Observer } from 'rxjs';
import { cloneDeep, noop, clone, forOwn } from 'lodash';

import { ENVIRONMENT } from '../app.constants';

export interface Response {
	data: {
		[key: string]: any
	};
	errors: any[];
}

export type TRequest = 'get' | 'post';

const TIMEOUT_ERROR: Response = {
	data: {},
	errors: [
		{
			code: 0,
			desc: 'Request cancelled due to timeout'
		}
	]	
};

const EMPTY_OBSERVER: Observer<Http.Response> = {
	next: noop,
	error: noop,
	complete: noop
};

interface IInterceptor {
	next?(res:Http.Response):void,
	error?(err:Http.Response):void,
	complete?():void
}

export class HttpGenerator {
	private headers        : Http.Headers;
	private http           : Http.Http;
	private timeout        : number;
	private timeoutErr     : Response = TIMEOUT_ERROR;
	private interceptors   : IInterceptor[];
	private host           : string = ENVIRONMENT.apiEndpoint;

	constructor(headers:Http.Headers, http:Http.Http, timeout:number, interceptors:IInterceptor[]) {
		this.headers = headers;
		this.http = http;
		this.timeout = timeout;
		this.interceptors = interceptors;
	}

	public setHeader(key:string, value: any):HttpGenerator {
		this.headers.set(key, value);
		return this;
	}

	public setTimeout(value:number) {
		this.timeout = value;
		return this;
	}

	public setInterceptor(interceptor:IInterceptor|IInterceptor[]):HttpGenerator {
		this.interceptors = this.interceptors.concat(interceptor);
		return this;
	}

	public changeHost(newHost:string):HttpGenerator {
		this.host = newHost;
		return this;
	}

	public get<T>(url:string):Observable<T> {
		return this._requestBuilder<T>('get', url);
	}

	public post<T>(url:string, data:any):Observable<T> {
		return this._requestBuilder<T>('post', url, data);
	}

	private _requestBuilder<T>(method:TRequest, url:string, data?:any):Observable<T> {
		let req$$:Observable<Http.Response & T>;

		/**
		 * Create Observable due to method
		 */
		switch (method) {
			case 'post':
				req$$ = this.http.post(this.host + url, data, {headers: this.headers});
			break;
			case 'get':
			default:
				req$$ = this.http.get(this.host + url, {headers: this.headers});
			break;
		}

		/**
		 * Set timeout to cancel request
		 */
		if (this.timeout) {
			req$$ = req$$.timeout(this.timeout, this.timeoutErr);
		}

		/**
		 * Add Interceptors
		 */
		this.interceptors.forEach(interceptor => {
			let interceptorToAdd: Observer<Http.Response> = clone<Observer<Http.Response>>(EMPTY_OBSERVER);

			interceptorToAdd.next     = interceptor.next || noop;
			interceptorToAdd.error    = interceptor.error || noop;
			interceptorToAdd.complete = interceptor.complete || noop;

			req$$ = req$$.do(interceptorToAdd);
		});

		/**
		 * Map Response to json
		 */
		req$$ = req$$.map(res => res.json());

		/**
		 * Return shared observable
		 */
		return req$$.share();
	}
}

@Injectable()
export class Request {
	private headers : Http.Headers;
	public  timeout : number = 0;
	private interceptors: IInterceptor[] = [];

	constructor(private _http:Http.Http) {
		/**
		 * Create Headers
		 */
		this.headers = new Http.Headers();

	}

	public get http():HttpGenerator {
		return new HttpGenerator(cloneDeep(this.headers), this._http, this.timeout, cloneDeep(this.interceptors));
	}

	public set http(value) {
		throw new Error('Changing http property is forbidden!');
	}

	public setHeader(key:string, value: any):void {
		this.headers.set(key, value);
	}

	public removeHeader(key:string) {
		this.headers.delete(key);
	}

	public setInterceptor(interceptor:IInterceptor|IInterceptor[]) {
		this.interceptors = this.interceptors.concat(interceptor);
	}
}