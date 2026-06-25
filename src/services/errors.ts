export class ServiceError extends Error {
	constructor(
		public readonly status: 403 | 404 | 409 | 502,
		message: string,
	) {
		super(message);
		this.name = "ServiceError";
	}
}
