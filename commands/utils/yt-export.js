import { Innertube, UniversalCache, Utils } from 'youtubei.js';

const yt = await Innertube.create({ 
  cache: new UniversalCache(false), 
  generate_session_locally: true });


export default yt;