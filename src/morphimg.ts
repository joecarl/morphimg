import MorphimgCpanel, { IMorphimgCpanelParams } from './cpanel';

interface IMorphimgParams {
	wrapper: HTMLElement;
	cpanel?: IMorphimgCpanelParams;
	width: number;
	height: number;
	src: string;
}

interface IForce {
	orig_x: number;
	orig_y: number;
	dest_x: number;
	dest_y: number;
}

export default class Morphimg {

	uvmode: number = -1;

	forces: IForce[] = [];

	selected_force_id: number = -1;

	selected_force: IForce;

	active_rendering: boolean = false;

	force_mult: number = 150;

	focus_val: number = 300;

	moving_node: number;

	percentage: number = 1;

	animation_speed: number = 10;

	animating: boolean = false;

	ctx: CanvasRenderingContext2D;

	overlay_ctx: CanvasRenderingContext2D;

	img: HTMLImageElement;

	width: number;

	height: number;

	working: boolean = false;


	constructor(params: IMorphimgParams) {

		const div = document.createElement('div');
		//div.style.width = '100%';
		//div.style.height = '100%';
		div.style.position = 'relative';

		this.width = params.width;
		this.height = params.height;

		const canvas = document.createElement('canvas');
		canvas.width = this.width;
		canvas.height = this.height;
		canvas.style.border = '1px solid black'; 
		canvas.style.zIndex = '2';

		const overlay = document.createElement('canvas');
		overlay.width = this.width;
		overlay.height = this.height;
		overlay.style.cursor = 'pointer'; 
		overlay.style.position = 'absolute'; 
		overlay.style.left = '0';
		overlay.style.top = '0';
		overlay.style.zIndex = '3';

		div.appendChild(canvas);
		div.appendChild(overlay);
		params.wrapper.appendChild(div);

		this.ctx = canvas.getContext("2d");
		this.overlay_ctx = overlay.getContext("2d");

		this.img = new Image();
		this.img.crossOrigin = '';
		this.img.src = params.src;
		this.img.onload = () => {
			this.drawImg();
			console.log('Image loaded');
		};

		overlay.addEventListener('mousemove', (evt: MouseEvent) => {

			if (this.working) {
				console.log('xhe!'); 
				return;
			}

			if (!this.active_rendering) return;
			//const bbox = overlay.getBoundingClientRect();
			const mx = evt.offsetX;// - bbox.left;
			const my = evt.offsetY;// - bbox.top;
			//const mx = mouse.layerX, my = mouse.layerY;
			if (this.moving_node === 2) {
				this.selected_force.dest_x = mx;
				this.selected_force.dest_y = my;
			}
			if (this.moving_node === 1) {
				this.selected_force.orig_x = mx;
				this.selected_force.orig_y = my;
			}
			this.drawForces();

			this.calcForcesMapping();
			
			this.deform();

		});
		overlay.addEventListener('mousedown', (evt: MouseEvent) => {
			const mx = evt.offsetX;
			const my = evt.offsetY;
			this.createForce(mx, my); 
		});
		overlay.addEventListener('mouseup', () => { this.active_rendering = false; });
		overlay.addEventListener('mouseleave', () => {
			this.overlay_ctx.clearRect(0, 0, canvas.width, canvas.height);
		});
		overlay.addEventListener('mouseenter', () => {
			this.drawForces();
		});

		document.onkeydown = (evt) => {
			//console.log(evt);
			if (evt.key === 'Delete') {
				if (this.selected_force_id === -1) return;
				console.log('Deleting force ' + this.selected_force_id);
				this.forces.splice(this.selected_force_id, 1);
				this.selected_force_id = -1;
				this.drawForces();
				this.deform();
			}
		};

		if (params.cpanel) {
			new MorphimgCpanel(this, params.cpanel);
		}

	}


	drawImg() {
		//if (src !== undefined) img.src = src;
		const ctx = this.ctx;
		const img = this.img;
		const width = this.width;
		const height = this.height;
		ctx.clearRect(0, 0, width, height);
		ctx.drawImage(img, 0, 0, img.width * width / img.height, height);

		
		const imageData = ctx.getImageData(0, 0, width, height);
		this.data = imageData.data;
	}


	invert() {
		const imageData = this.ctx.getImageData(0, 0, this.width, this.height);
		const data = imageData.data;
		for (let i = 0; i < data.length; i += 4) {
			data[i]     = 255 - data[i];     // red
			data[i + 1] = 255 - data[i + 1]; // green
			data[i + 2] = 255 - data[i + 2]; // blue
		}
		this.ctx.putImageData(imageData, 0, 0);
	}

	createForce(mx: number, my: number) {

		this.active_rendering = true;
		//vamos a comprobar si hemos hecho click sobre una fuerza existente, en ese caso solo la seleccionaremos.
		
		const numForces = this.forces.length;
		for (let k = 0; k < numForces; k++) {
			const force = this.forces[k];
			if (Math.abs(mx - force.orig_x) < 7 && Math.abs(my - force.orig_y) < 7) {
				this.selected_force_id = k;
				this.selected_force = force;
				this.moving_node = 1;
				this.drawForces();
				return;
			}
			if (Math.abs(mx - force.dest_x) < 7 && Math.abs(my - force.dest_y) < 7) {
				this.selected_force_id = k;
				this.selected_force = force;
				this.moving_node = 2;
				this.drawForces();
				return;
			}
		}

		this.forces.push({
			orig_x: mx,
			orig_y: my,
			dest_x: mx,
			dest_y: my,
		});

		this.selected_force_id = this.forces.length - 1;
		this.selected_force = this.forces[this.selected_force_id];
		this.moving_node = 2;
		this.drawForces();

	};


	drawForces() {
		
		const oCtx = this.overlay_ctx;

		oCtx.clearRect(0, 0, this.width, this.height);
		this.forces.forEach((force, id) => {

			oCtx.strokeStyle = '#755';
			oCtx.save();
			oCtx.beginPath();
			oCtx.moveTo(force.orig_x, force.orig_y);
			oCtx.lineTo(force.dest_x, force.dest_y);
			oCtx.stroke();
			oCtx.beginPath();
			oCtx.setLineDash([5, 10]);
			oCtx.strokeStyle = id === this.selected_force_id ? '#FDD' : '#859';
			oCtx.moveTo(force.orig_x, force.orig_y);
			oCtx.lineTo(force.dest_x, force.dest_y);
			oCtx.stroke();
			oCtx.restore();

			oCtx.beginPath();
			oCtx.arc(force.orig_x, force.orig_y, 5, 0, 2 * Math.PI, false);
			oCtx.fillStyle = '#e62';
			oCtx.fill();
			oCtx.lineWidth = 1;
			oCtx.stroke();
			oCtx.beginPath();
			oCtx.arc(force.dest_x, force.dest_y, 4, 0, 2 * Math.PI, false);
			oCtx.fillStyle = '#b59';
			oCtx.fill();
			oCtx.stroke();
		});
	}

	mapCache: {x: number, y: number}[];

	calcForcesMapping() {
		
		const width = this.width;
		const height = this.height;
		const data_length = this.data.length / 4;
		const uvmode = this.uvmode;
		const force_mult = this.force_mult;
		const focus_val = this.focus_val;
		const forces = this.forces;

		const fBaseCache = [];
		const numForces = forces.length;

		for (let k = 0; k < numForces; k++) {
			const force = forces[k];
			const force_x = force.dest_x - force.orig_x;
			const force_y = force.dest_y - force.orig_y;
			//const dist = Math.sqrt(Math.pow(x - force.orig_x - force.dx, 2) + Math.pow(y - force.orig_y - force.dy, 2) );
			const base = uvmode * force_mult;
			
			fBaseCache.push({
				dx: base * force_x,
				dy: base * force_y,
			});
		}

		this.mapCache = [];
		for (let i = 0; i < data_length; i++) {

			const y = Math.floor(i / width);
			const x = i - y * width;
			let incx = 0;
			let incy = 0;

			for (let k = 0; k < numForces; k++) {
				const force = forces[k];
				const fCache = fBaseCache[k];
				const dist = Math.sqrt(Math.pow(x - force.orig_x, 2) + Math.pow(y - force.orig_y, 2));
				//const dist = Math.sqrt(Math.pow(x - force.orig_x - force.dx, 2) + Math.pow(y - force.orig_y - force.dy, 2) );
				const div = dist * dist / 5 + focus_val;
				incx += fCache.dx / div;
				incy += fCache.dy / div;
			}

			//newx = Math.max(Math.min(Math.floor(newx), width - 1), 0);
			//newy = Math.max(Math.min(Math.floor(newy), height - 1), 0);

			this.mapCache.push({ x: incx, y: incy });

		}
	}

	data: Uint8ClampedArray;

	deform() {

		if (this.working) {
			console.log('xhe!'); 
			return;
		}

		this.working = true;
		//this.drawImg();

		//const map = [];
		const ctx = this.ctx;
		const width = this.width;
		const height = this.height;

		//const imageData = ctx.getImageData(0, 0, width, height);
		//const data = imageData.data;
		const data = this.data;
		const newImageData = ctx.createImageData(width, height);
		const newdata = newImageData.data;

		//for (i = 0; i < newdata.length; i ++) { newdata[i] = data[i];}
		
		/*
		for (const force of this.forces) {
			const fx = force.dest_x - force.orig_x;
			const fy = force.dest_y - force.orig_y;
			//dist = 0//const dist = Math.sqrt(Math.pow(x - force.orig_x, 2) + Math.pow(y - force.orig_y, 2) );
			const distort = uvmode * percentage * force_mult / focus_val;
			force.dx = distort * fx;
			force.dy = distort * fy;
		}
		*/

		const data_length = data.length / 4;
		//let prev_newx = 0, prev_newy = [];
		//for (i=0; i<width; i++) prev_newy[i] = 0;
		const uvmode = this.uvmode;
		const percentage = this.percentage;
		const force_mult = this.force_mult;
		const focus_val = this.focus_val;
		const forces = this.forces;

		const fBaseCache = [];
		const numForces = forces.length;

		

		for (let i = 0; i < data_length; i++) {

			const y = Math.floor(i / width);
			const x = i - y * width;

			const mapping = this.mapCache[i];
			let newx = x + percentage * mapping.x;
			let newy = y + percentage * mapping.y;
			/*

			for (let k = 0; k < numForces; k++) {
				const force = forces[k];
				const fCache = fBaseCache[k];
				const dist = Math.sqrt(Math.pow(x - force.orig_x, 2) + Math.pow(y - force.orig_y, 2));
				//const dist = Math.sqrt(Math.pow(x - force.orig_x - force.dx, 2) + Math.pow(y - force.orig_y - force.dy, 2) );
				const div = dist * dist / 5 + focus_val;
				newx += fCache.dx / div;
				newy += fCache.dy / div;
			}
			//newx = Math.floor(newx);
			//newy = Math.floor(newy);

			*/
			newx = Math.max(Math.min(Math.floor(newx), width - 1), 0);
			newy = Math.max(Math.min(Math.floor(newy), height - 1), 0);

			//if (newx - prev_newx > 1)

			/*
			for (let fix_x = prev_newx; fix_x <= newx; fix_x++) {
				//for (let fix_y = prev_newy[fix_x]; fix_y <= newy; fix_y++) {
					const offset_n = (y * width + x) * 4;
					for (k = 0; k < 4; k++) {
						newdata[4 * (newy * width + fix_x) + k] = data[offset_n + k];
					}
				//}
				//prev_newy[fix_x] = fix_y;
			}
			prev_newx = newx;
			*/
			const offset_pos = (y * width + x) * 4 ;
			const offset_pos_n = (newy * width + newx) * 4;
			//const offset_pos_n = (this.mapCache[i]) * 4;
			for (let k = 0; k < 4; k++)
				if (this.uvmode === 1)
					newdata[offset_pos_n + k] = data[offset_pos + k];
				else
					newdata[offset_pos + k] = data[offset_pos_n + k];
			//map[2 * (y * width + x)] = newx;
			//map[2 * (y * width + x) + 1] = newy;
		}
		/*
		for (let j = 0; j < height; j ++) {
			const offset_j = j * width;
			for (i = 0; i < width; i ++) {
				const offset_i = 2*(offset_j + i);
				//if (map[offset_i] === undefined) map[offset_i];
				const u = map[offset_i];
				const v = map[offset_i + 1];
				const nx = Math.floor(u);
				const ny = Math.floor(v);
				const offset_n = (ny*width + nx) * 4;
				for (k = 0; k < 4; k++) {
					const vectorized_pos = offset_i * 2 + k;
					newdata[vectorized_pos] = data[offset_n + k];
					//newdata[vectorized_pos] = data[offset_n + k];// + data[(ny - 1) * 4 * width + nx * 4 + k] +
											  //data[(ny + 1) * 4 * width + nx * 4 + k] + data[ny * 4 * width + (nx-1) * 4 + k]) / 4;
				}
			}
		}*/
		ctx.putImageData(newImageData, 0, 0);
		this.working = false;
	}

	animate() {

		if (this.animating) return;
		this.animating = true;
		this.percentage = 0;
		//let gr = 0;
		const animation = () => {
			if (!this.animating) return;
			this.percentage += 0.001 * this.animation_speed;//;1 - Math.pow(Math.sin(gr += 0.015), 6);
			this.deform();
			if (this.percentage >= 1) {
				this.percentage = 1;
				this.animating = false;
				//clearInterval(animation);
			}
			else if (this.animating) window.requestAnimationFrame(animation);
		};

		window.requestAnimationFrame(animation);

	}


	deleteAllForces() {
		this.forces = [];
		this.selected_force_id = -1;
		this.deform();
	}


	stopAnimation() {
		this.animating = false;
		this.percentage = 1;
		//clearInterval(animation);
	}


	loadImageFile(file: Blob) {

		const reader = new FileReader();

		reader.onloadend = () => {
			this.img.src = reader.result.toString();
		};

		if (file) {
			reader.readAsDataURL(file);
		} else {
			this.img.src = '';
		}

	}

}
