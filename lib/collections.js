
export class Queue {
	static node(value, next = null) {
		return {value, next};
	}

	constructor() {
		// values move through the "digestive track" from head to ass

		// don't mess directly with any of these properties, seriously
		this._head = null;
		this._ass = null;
		this._length = 0;
	}

	// eat a value in the head of the queue
	enqueue(value) {
		if (this._length === 0) {
			this._ass = this._head = this.constructor.node(value);
		} else {
			this._head.next = this.constructor.node(value);
			this._head = this._head.next;
		}

		this._length++;
	}

	// crap a value out the ass of the queue
	dequeue() {
		if (this._length === 0)
			throw new Error('Cannot dequeue from empty Queue');
		else {
			const {value} = this._ass;
			this._ass = this._ass.next;

			if (this._length === 1)
				this._head = null;
			this._length--;

			return value;
		}
    }
    
    clear() {
		this._head = null;
		this._ass = null;
		this._length = 0;
    }

	get length() {
		return this._length;
	}
}

export class Stream {
	constructor(controller) {
		const add = (val) => {
			this.ledger.push(val);
			
			this._listeners.add.forEach((listener) => {
				listener(val);
			});
		}

		const end = () => {
			this.ended = true;
			this._listeners.end.forEach((listener) => {
				listener();
			});
		}

		this.ledger = [];
		this.ended = false;
		this._listeners = {
			add: [],
			end: []
		}

		controller(add, end);
	}

	_onEnd(listener) {
		if (this.ended) {
			listener();
		} else {
			this._listeners.end.push(listener);
		}
	}

	iterate() {
		let i = 0;

		return {
			[Symbol.asyncIterator]() {
				return this;
			},
			next: () => {
				const index = i++;

				if (index < this.ledger.length) {
					return Promise.resolve({
						done: false,
						value: this.ledger[index]
					});
				} else {
					return new Promise((resolve, reject) => {
						this._listeners.add.push((value) => {
							if (index + 1 === this.ledger.length) {
								resolve({
									done: false,
									value
								});
							}
						});

						this._onEnd(() => {

							if (index > this.ledger.length) {
								reject(new Error("Oops"));
							} else if (index === this.ledger.length) {
								resolve({
									done: true
								});
							}
						});
					});
				}
			}
		}
	}
}
