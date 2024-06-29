import { Morphimg } from './morphimg';

interface ITestImg {
	label: string;
	src: string;
}

export interface IMorphimgCpanelParams {
	wrapper: HTMLElement;
	testImgs?: ITestImg[];
}

export class MorphimgCpanel {

	mph: Morphimg;

	wrapper: HTMLElement;

	testImgs: ITestImg[];

	constructor(mph: Morphimg, params: IMorphimgCpanelParams) {

		this.mph = mph;
		this.wrapper = params.wrapper;
		this.testImgs = params.testImgs ?? [];

		this.setHTML();
		this.setupEvents();

	}

	setHTML() {

		const html = `
		<div class="tools-row">
			Force intensity: <input id="mph-cpanel-forcemult" type="number" value="150"/>
			Expansion: <input id="mph-cpanel-focus" type="number" value="300"/>
			<input id="mph-cpanel-deleteforces" value="Delete all forces" type="button">
		</div>
		<div class="tools-row">
			<input id="mph-cpanel-animatebtn" value="Animate" type="button">
			<input id="mph-cpanel-stopbtn" value="Stop" type="button">
			Speed: <input id="mph-cpanel-speed" type="number" value="10"/>
		</div>
		<div class="tools-row">
			Deformation mode: 
			<select id="mph-cpanel-uvmode">
				<option value="1">Wired</option>
				<option value="-1" selected>Inverted</option>
			</select>
		</div>
		<div class="tools-row" id="mph-cpanel-files-row">
			<label class="button">Select custom file ...<input id="mph-cpanel-selectimg" type="file" style="display: none"></label>
		</div>
		<div class="tools-row">
			<input id="mph-cpanel-invertbtn" value="Invert colors" type="button">
		</div>
		`;

		this.wrapper.innerHTML = html;

	}

	elem(id: string) {

		const elem = document.getElementById(id);
		if (!elem) {
			throw Error('Error setting ' + id);

		}
		return elem;

	}

	setupEvents() {

		const mph = this.mph;

		this.elem('mph-cpanel-invertbtn').addEventListener('click', () => {
			mph.invert()
		});

		const changeParams = (evt: InputEvent) => {
			const inp = evt.target as HTMLInputElement;
			if (inp.id === 'mph-cpanel-forcemult') {
				mph.force_mult = parseInt(inp.value);
			}
			else if (inp.id === 'mph-cpanel-focus') {
				mph.focus_val = Math.floor(parseFloat(inp.value));
			}
			else if (inp.id === 'mph-cpanel-speed') {
				mph.animation_speed = Math.floor(parseFloat(inp.value));
				return;
			}
			else if (inp.id === 'mph-cpanel-uvmode') {
				const e = evt.target as HTMLSelectElement;
				mph.uvmode = parseInt(e.options[e.selectedIndex].value);//parseInt es necesario para evitar que luego haga la conversion en cada iteracion
			}
			mph.refresh();
		};

		this.elem('mph-cpanel-forcemult').addEventListener('change', changeParams);
		this.elem('mph-cpanel-focus').addEventListener('change', changeParams);
		this.elem('mph-cpanel-speed').addEventListener('change', changeParams);
		this.elem('mph-cpanel-uvmode').addEventListener('change', changeParams);
		this.elem('mph-cpanel-deleteforces').addEventListener('click', () => {
			mph.deleteAllForces();
			console.log('All forces deleted!');
		});

		this.elem('mph-cpanel-animatebtn').addEventListener('click', () => {
			mph.animate();
		});

		this.elem('mph-cpanel-stopbtn').addEventListener('click', () => {
			mph.stopAnimation();
		});

		const selectImgFile = this.elem('mph-cpanel-selectimg') as HTMLInputElement;

		const filesRow = this.elem('mph-cpanel-files-row');

		this.testImgs.forEach(tImg => {
			const btn = document.createElement('button');
			btn.innerText = tImg.label;
			btn.addEventListener('click', () => {
				mph.img.src = tImg.src;
			});
			filesRow.appendChild(btn);
		});

		selectImgFile.addEventListener('change', () => {
			const file = selectImgFile.files[0];
			mph.loadImageFile(file);
		});

	}
}