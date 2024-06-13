/**
 * @module
 * The module provides a function to parse GSD formatted
 * sounding reports from GSL.
 *
 * For more information see the {@link https://github.com/erictaylor/gsl-sounding-parser/blob/main/README.md|GitHub README}.
 */

/**
 * Lines types as defined the in the GSD Sounding Format.
 *
 * @url https://rucsoundings.noaa.gov/raob_format.html
 */
enum GSDLineIdentifier {
	StationIdentification = '1',
	SoundingChecks = '2',
	StationIdentifier = '3',
	MandatoryLevel = '4',
	SignificantLevel = '5',
	WindLevel = '6',
	TropopauseLevel = '7',
	MaxWindLevel = '8',
	SurfaceLevel = '9',
}

/**
 * Wind speed units.
 */
export enum WindUnits {
	/**
	 * Knots
	 */
	KT = 'kt',
	/**
	 * Meters per second (tenths)
	 */
	MS = 'ms',
}

/**
 * Type of radiosonde code from TTBB.
 * Only reported with GTS data.
 */
export enum Sonde {
	TypeA = 10,
	TypeB = 11,
	SpaceDataCorp = 12,
}

/**
 * The data for a single level in a sounding report.
 */
export type SoundingDatum = Readonly<{
	/**
	 * Pressure in whole millibars (original format),
	 * or in tenths of millibars (new format).
	 */
	pressure: number;
	/**
	 * Height in meters.
	 */
	height: number;
	/**
	 * Temperature in tenths of degrees Celsius.
	 */
	temp: number;
	/**
	 * Dewpoint in tenths of degrees Celsius.
	 */
	dewpt?: number;
	/**
	 * Wind direction in degrees.
	 */
	windDir: number;
	/**
	 * Wind speed in knots.
	 */
	windSpd: number;
	/**
	 * Hour and minute (UTC) that this data line was taken
	 * (for RAOBS, estimated by assuming a 5 m/s ascent rate).
	 */
	hhmm?: number;
	/**
	 * Bearing from the ground point for this level.
	 */
	bearing?: number;
	/**
	 * Range (nautical miles) from the ground point for this level.
	 */
	range?: number;
}>;

/**
 * Sounding for Rapid Refresh (RAP) report.
 *
 * The Rapid Refresh is the continental-scale NOAA hourly-updated
 * assimilation/modeling system operational at NCEP. RAP covers
 * North America and is comprised primarily of a numerical forecast
 * model and an analysis/assimilation system to initialize that model.
 */
export type SoundingReport = Readonly<{
	cape: number;
	cin: number;
	data: readonly SoundingDatum[];
	/**
	 * The UTC date and time of the sounding in ISO 8601 format.
	 */
	date: string;
	/**
	 * Elevation from station history in meters.
	 */
	elev?: number;
	/**
	 * Latitude in degrees and hundredths.
	 */
	lat: number;
	/**
	 * Longitude in degrees and hundredths.
	 */
	lon: number;
	/**
	 * Actual release time of radiosonde from TTBB.
	 * Appears in GTS data only.
	 */
	rtime?: number;
	/**
	 * Type of radiosonde code from TTBB.
	 * Only reported with GTS data.
	 *
	 * 10 = VIZ "A" type radiosonde
	 * 11 = VIZ "B" type radiosonde
	 * 12 = Space data corp.(SDC) radiosonde.
	 */
	sonde: Sonde;
	/**
	 * Station identifier.
	 */
	stationId: string;
	/**
	 * The sounding report model type.
	 *
	 * A RAP will have a type of 'Op40'.
	 *
	 * @example 'Op40'
	 */
	type: string;
	wban?: number;
	/**
	 * Wind speed units.
	 *
	 * ms = tenths of meters per second
	 * kt = knots
	 */
	windUnits: WindUnits;
	wmo?: number;
}>;

const NOT_APPLICABLE = 99_999;

const splitLine = (line: string): string[] => line.trim().split(/\s+/);

const parseIntegerValue = (value: string | undefined): number | undefined => {
	if (value === undefined) {
		return undefined;
	}

	const parsedValue = Number.parseInt(value);

	return Number.isNaN(parsedValue)
		? undefined
		: parsedValue !== NOT_APPLICABLE
			? parsedValue
			: undefined;
};

const parseToNumber = <T extends Record<string, string | undefined>>(
	value: T,
): Record<keyof T, number | undefined> => {
	const result: Record<keyof T, number | undefined> = {} as Record<
		keyof T,
		number | undefined
	>;

	for (const key in value) {
		result[key] = parseIntegerValue(value[key]);
	}

	return result;
};

const getMonth = (month: string): number => {
	const months: Record<string, number> = {
		JAN: 0,
		FEB: 1,
		MAR: 2,
		APR: 3,
		MAY: 4,
		JUN: 5,
		JUL: 6,
		AUG: 7,
		SEP: 8,
		OCT: 9,
		NOV: 10,
		DEC: 11,
	};

	const dateMonth = months[month.toUpperCase()];

	if (dateMonth === undefined) {
		throw new Error(`Invalid month: ${month}`);
	}

	return dateMonth;
};

const isSonde = (value: number): value is Sonde => {
	return (
		value === Sonde.TypeA ||
		value === Sonde.TypeB ||
		value === Sonde.SpaceDataCorp
	);
};

const isWindUnits = (value: string | undefined): value is WindUnits => {
	if (value === undefined) {
		return false;
	}

	return value === WindUnits.KT || value === WindUnits.MS;
};

const parseDateLine = (line: string): Pick<SoundingReport, 'date' | 'type'> => {
	const lineParts = splitLine(line);

	const type = lineParts[0];
	if (typeof type !== 'string') {
		throw new Error('Failed to parse type from meta line');
	}

	const year = lineParts[4] ? Number.parseInt(lineParts[4]) : null;
	const month = lineParts[3] ? getMonth(lineParts[3]) : null;
	const day = lineParts[2] ? Number.parseInt(lineParts[2]) : null;
	const hour = lineParts[1] ? Number.parseInt(lineParts[1]) : null;

	if (!(year && month && day && hour)) {
		throw new Error('Failed to parse date from meta line');
	}

	let date: string;

	try {
		date = new Date(Date.UTC(year, month, day, hour)).toISOString();
	} catch (error) {
		throw new Error('Failed to parse date line', { cause: error });
	}

	return { date, type };
};

const parseCapeCinLine = (
	line: string,
): Pick<SoundingReport, 'cape' | 'cin'> => {
	const lineParts = splitLine(line);

	const cape = parseIntegerValue(lineParts[1]);
	const cin = parseIntegerValue(lineParts[3]);

	if (cape === undefined || cin === undefined) {
		throw new Error('Failed to parse cape/cin line');
	}

	return { cape, cin };
};

const parseStationIdentificationLine = (
	lineParts: string[],
): Pick<SoundingReport, 'elev' | 'lat' | 'lon' | 'rtime' | 'wban' | 'wmo'> => {
	const latLon = lineParts[3];

	if (!latLon) {
		throw new Error('Failed to parse station identification line');
	}

	if (Number.isNaN(Number.parseInt(latLon))) {
		const split = latLon.split('-');
		const lastPart = split.pop();
		const firstPart = split.join('-');
		lineParts.splice(3, 1, firstPart, `-${lastPart}`);
	}

	const [_, wban, wmo, _lat, _lon, elev, rtime] = lineParts;

	const lat = Number.parseFloat(_lat ?? '');
	const lon = Number.parseFloat(_lon ?? '');

	if (Number.isNaN(lat) || Number.isNaN(lon)) {
		throw new Error('Failed to parse lat/lon from station identification line');
	}

	return {
		...parseToNumber({
			wban,
			wmo,
			elev,
			rtime,
		}),
		lat,
		lon,
	};
};

const parseStationIdentifierLine = ([
	,
	stationId,
	_sonde,
	windUnits,
]: string[]): Pick<SoundingReport, 'sonde' | 'stationId' | 'windUnits'> => {
	if (!stationId) {
		throw new Error('Failed to parse stationId from station identifier line');
	}

	const sonde = Number.parseInt(_sonde ?? '');

	if (!isSonde(sonde)) {
		throw new Error(`Unrecognized sonde type: ${sonde}`);
	}

	if (!isWindUnits(windUnits)) {
		throw new Error(`Unrecognized wind units: ${windUnits}`);
	}

	return {
		sonde,
		stationId,
		windUnits,
	};
};

const parseDataLines = (dataLines: string[][]): readonly SoundingDatum[] => {
	return dataLines
		.map(parseDataLine)
		.filter(
			(data): data is SoundingDatum =>
				data.height !== undefined &&
				data.height !== NOT_APPLICABLE &&
				data.pressure !== undefined &&
				data.pressure !== NOT_APPLICABLE &&
				data.temp !== undefined &&
				data.temp !== NOT_APPLICABLE &&
				data.windDir !== undefined &&
				data.windDir !== NOT_APPLICABLE &&
				data.windSpd !== undefined &&
				data.windSpd !== NOT_APPLICABLE,
		);
};

const parseDataLine = ([
	,
	pressure,
	height,
	temp,
	dewpt,
	windDir,
	windSpd,
]: string[]): Partial<SoundingDatum> => {
	const parsedData = parseToNumber({
		pressure,
		height,
		temp,
		dewpt,
		windDir,
		windSpd,
	});

	return parsedData;
};

const parseLines = (
	lines: string[],
): Pick<
	SoundingReport,
	| 'data'
	| 'elev'
	| 'lat'
	| 'lon'
	| 'rtime'
	| 'sonde'
	| 'stationId'
	| 'wban'
	| 'windUnits'
	| 'wmo'
> => {
	const lineParts = lines.map(splitLine);

	const stationIdentificationLine = lineParts.find(
		(line) => line[0] === GSDLineIdentifier.StationIdentification,
	);

	const stationIdentifierLine = lineParts.find(
		(line) => line[0] === GSDLineIdentifier.StationIdentifier,
	);

	if (!(stationIdentificationLine && stationIdentifierLine)) {
		throw new Error('Failed to parse station identification lines');
	}

	const stationIdentificationData = parseStationIdentificationLine(
		stationIdentificationLine,
	);
	const stationIdentifierData = parseStationIdentifierLine(
		stationIdentifierLine,
	);

	const dataLines = lineParts.filter(
		(line) =>
			line[0] === GSDLineIdentifier.MandatoryLevel ||
			line[0] === GSDLineIdentifier.SignificantLevel ||
			line[0] === GSDLineIdentifier.SurfaceLevel,
	);

	const data = parseDataLines(dataLines);

	return { ...stationIdentificationData, ...stationIdentifierData, data };
};

const parseReport = (rawReport: string): SoundingReport | undefined => {
	const lines = rawReport.split('\n');

	const metaLine = lines.shift();
	const dateLine = lines.shift();
	const capeCineLine = lines.shift();

	if (!(metaLine && dateLine && capeCineLine)) {
		return undefined;
	}

	const { date, type } = parseDateLine(dateLine);
	const { cape, cin } = parseCapeCinLine(capeCineLine);

	const data = parseLines(lines);

	return {
		cape,
		cin,
		date,
		type,
		...data,
	};
};

/**
 * Parse GSD formatted sounding reports.
 *
 * @param rawInput - The raw GSD formatted sounding reports.
 * @returns The parsed sounding reports.
 *
 * @example
 * ```ts
 * import { parse } from 'gsl-sounding-parser';
 *
 * const soundingReports = parse(gsdString);
 * ```
 */
export const parse = (rawInput: string): readonly SoundingReport[] => {
	if (typeof rawInput !== 'string') {
		throw new TypeError('Invalid input. Expected a string.');
	}

	const rawReports = rawInput
		// Split into individual reports by splitting on blank lines
		.split(/(\n[\s]*\n)/)
		// Remove any blank lines from the resulting array
		.filter((line) => line.trim());

	const parsedReports: readonly SoundingReport[] = rawReports
		.map(parseReport)
		.filter((report): report is SoundingReport => report !== undefined);

	if (parsedReports.length === 0) {
		throw new Error(
			'Failed to parse. Ensure the input is a valid GSD formatted string.',
		);
	}

	return parsedReports;
};

export default parse;
