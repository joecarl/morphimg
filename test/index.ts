import Morphimg from '../src/index';

function elem(id: string) {

	const elem = document.getElementById(id);
	if (!elem) {
		throw Error('Error setting ' + id);

	}
	return elem;

}
const imgPrefix =  'https://copinstar.com/dist/test_img';

document.addEventListener("DOMContentLoaded", function() {

	const mph = new Morphimg({
		wrapper: elem('morphimg-wr'),
		width: 500,
		height: 500,
		src: imgPrefix + '/obama.png',
		cpanel: {
			wrapper: elem('morphimg-cpanel-wr'),
			testImgs: [
				{ src: imgPrefix + '/obama.png', label: 'Obama' },
				{ src: imgPrefix + '/leonardo.jpg', label: 'Di caprio' },
				{ src: imgPrefix + '/norris1.jpg', label: 'Chuck Norris' },
				{ src: imgPrefix + '/casey.jpg', label: 'Casey' },
			]
		}
	});

	const numforces = elem('numforces');

	setInterval(() => {
		numforces.innerText = '' + mph.forces.length;
	}, 500);

	console.log('started');
	
});