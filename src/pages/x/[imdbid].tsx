import { getMdblistClient } from '@/services/mdblistClient';
import { useRouter } from 'next/router';
import { useEffect } from 'react';

const MdblistRedirect = () => {
	const router = useRouter();
	const { imdbid } = router.query;

	useEffect(() => {
		if (!imdbid) return;
		const mdblistClient = getMdblistClient();
		mdblistClient
			.getInfoByImdbId(imdbid as string)
			.then((resp) => router.replace(`/${resp.type}/${imdbid}`))
			.catch(() => router.replace(`/movie/${imdbid}`));
	}, [imdbid, router]);

	return null;
};

export default MdblistRedirect;
