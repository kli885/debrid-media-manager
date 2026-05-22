import { useRouter } from 'next/router';
import { useEffect } from 'react';

const RedirectPage = () => {
	const router = useRouter();
	const { imdbid } = router.query;

	useEffect(() => {
		if (imdbid) {
			router.replace(`/show/${imdbid}/1`);
		}
	}, [imdbid, router]);

	return null;
};

export default RedirectPage;
