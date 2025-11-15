export type DateString = string; // Format: 'YYYY-MM-DD'

export class DateHelper {
	/**
	* Convert any date input to normalized YYYY-MM-DD string
	* Always uses local timezone (no UTC conversion)
	*/
	static toDateString(input: Date | string | DateString): DateString {
		if (typeof input === 'string') {
			// Already a string, validate and normalize
			const date = new Date(input);
			if (isNaN(date.getTime())) {
				throw new Error(`Invalid date string: ${input}`);
			}
			// Extract local date parts (not UTC)
			const year = date.getFullYear();
			const month = String(date.getMonth() + 1).padStart(2, '0');
			const day = String(date.getDate()).padStart(2, '0');
			return `${year}-${month}-${day}`;
		}

		// Date object - use local timezone
		const year = input.getFullYear();
		const month = String(input.getMonth() + 1).padStart(2, '0');
		const day = String(input.getDate()).padStart(2, '0');
		return `${year}-${month}-${day}`;
	}

	/*
	* Convert YYYY-MM-DD string to Date object at local midnight
	*/
	static toDate(dateStr: DateString): Date {
		const [year, month, day] = dateStr.split('-').map(Number);
		return new Date(year, month - 1, day); // Local timezone
	}

	/*
	* Get today as YYYY-MM-DD string
	*/
	static today(): DateString {
		return this.toDateString(new Date());
	}

	/*
	* Compare two dates (works with Date or string)
	*/
	static isSameDay(a: Date | DateString, b: Date | DateString): boolean {
		return this.toDateString(a) === this.toDateString(b);
	}

	/*
	* Check if date is before another
	*/
	static isBefore(date: Date | DateString, compare: Date | DateString): boolean {
		return this.toDateString(date) < this.toDateString(compare);
	}

	/*
	* Check if date is after another
	*/
	static isAfter(date: Date | DateString, compare: Date | DateString): boolean {
		return this.toDateString(date) > this.toDateString(compare);
	}

	/*
	* Add interval to a date
	*/
	static addInterval(
		dateStr: DateString,
		interval: number,
		unit: 'days' | 'weeks' | 'months' | 'years'
	): DateString {
		const date = this.toDate(dateStr);

		switch (unit) {
			case 'days':
				date.setDate(date.getDate() + interval);
				break;
			case 'weeks':
				date.setDate(date.getDate() + interval * 7);
				break;
			case 'months':
				date.setMonth(date.getMonth() + interval);
				break;
			case 'years':
				date.setFullYear(date.getFullYear() + interval);
				break;
		}
		return this.toDateString(date);
	}

	/*
	* Format date for display
	*/
	static format(dateStr: DateString, locale: string = 'en-US'): string {
		const date = this.toDate(dateStr);
		const today = new Date();
		const yesterday = new Date(today);
		yesterday.setDate(yesterday.getDate() - 1);
		
		if (this.isSameDay(date, today)) {
			return 'Today';
		} else if (this.isSameDay(date, yesterday)) {
			return 'Yesterday';
		}
		
		return date.toLocaleDateString(locale, { 
			weekday: 'long', 
			year: 'numeric', 
			month: 'long', 
			day: 'numeric' 
		});
	}

	/**
	 * Get days between two dates
	 */
	static daysBetween(from: DateString, to: DateString): number {
		const fromDate = this.toDate(from);
		const toDate = this.toDate(to);
		const diffTime = toDate.getTime() - fromDate.getTime();
		return Math.floor(diffTime / (1000 * 60 * 60 * 24));
	}

	/**
	 * Parse various date formats to DateString
	 */
	static parse(input: any): DateString | null {
		try {
			if (input instanceof Date) {
				return this.toDateString(input);
			}
			if (typeof input === 'string') {
				return this.toDateString(input);
			}
			return null;
		} catch {
			return null;
		}
	}

	static formatDateString(year: number, month: number, day: number): DateString {
		const date = new Date(year, month - 1, day);
		return this.toDateString(date);
	}
}
