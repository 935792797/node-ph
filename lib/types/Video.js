const UTIL = require('../util.js');

class Video {
	constructor() {
		const thumbnail = undefined;
		const title = undefined;
		const data_id = undefined;
		const id = undefined;
		const owner = new Channel();
		const views = undefined;
		const views_exact = undefined;
		const likes = undefined;
		const dislikes = undefined;
		const categories = undefined;
		const pornstars = undefined;
		const production = undefined;
		const tags = undefined;
		const added = undefined;
		const comments = undefined;
		const relatedVideos = undefined;
		const includingPlaylists = undefined;
	}
}
Video.BASE_URL = 'https://pornhub.com/view_video.php?viewkey=<id>'

exports.fetchVideo = async (id) => {
	const page = await UTIL.getPornhubPage(Video.BASE_URL.replace('<id>', id))
	const parsed = {};
	parsed.views_exact = Number(UTIL.between(page, '<div class="views"><span class="count">', '</span> views</div>').replace(/\./g,''));
	parsed.likes = Number(UTIL.between(page, '<span class="votesUp">', '</span>').replace(/\./g,''));
	parsed.dislikes = Number(UTIL.between(page, '<span class="votesDown">', '</span>').replace(/\./g,''));
	parsed.video_id = UTIL.between(page, '<div id="player" class="original mainPlayerDiv" data-video-id="', '"');

	const player_data = JSON.parse(UTIL.between(page, 'var flashvars_'+parsed.video_id+' =', ';\n\t\tvar player_mp4_seek =').trim());
	parsed.related_data = player_data.related_url;
	parsed.thumbnail = player_data.image_url;
	parsed.title = player_data.video_title;
	parsed.streams = player_data.mediaDefinitions;

	console.log(parsed, player_data);
}
