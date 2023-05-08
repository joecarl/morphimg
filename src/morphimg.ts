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

interface IForceInc {
	x: number;
	y: number;
}

export default class Morphimg {

	uvmode: number = -1;

	forces: IForce[] = [];

	selected_force_id: number = -1;

	editing: boolean = false;

	moving_node: number;

	force_mult: number = 150;

	focus_val: number = 300;

	percentage: number = 1;

	animation_speed: number = 10;

	animating: boolean = false;

	ctx: CanvasRenderingContext2D;

	overlay_ctx: CanvasRenderingContext2D;

	img: HTMLImageElement;

	width: number;

	height: number;

	incMapCache: IForceInc[] = [];


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

		let semiMapping = [];
		overlay.addEventListener('mousemove', (evt: MouseEvent) => {

			if (!this.editing) return;
			const selectedForce = this.forces[this.selected_force_id];
			//const bbox = overlay.getBoundingClientRect();
			const mx = evt.offsetX;// - bbox.left;
			const my = evt.offsetY;// - bbox.top;
			//const mx = mouse.layerX, my = mouse.layerY;
			if (this.moving_node === 2) {
				selectedForce.dest_x = mx;
				selectedForce.dest_y = my;
			}
			if (this.moving_node === 1) {
				selectedForce.orig_x = mx;
				selectedForce.orig_y = my;
			}
			this.drawForces();

			this.incMapCache = [];
			
			const dataLength = this.data.length / 4;

			for (let i = 0; i < dataLength; i++) {
				
				const y = Math.floor(i / this.width);
				const x = i - y * this.width;
				const fIncs = this.calcForceIncs(x, y, selectedForce);
				
				this.incMapCache.push({
					x: semiMapping[i].x + fIncs.x,
					y: semiMapping[i].y + fIncs.y,
				});
			}
			
			this.render();

		});
		overlay.addEventListener('mousedown', (evt: MouseEvent) => {

			const mx = evt.offsetX;
			const my = evt.offsetY;
			this.createForce(mx, my);
			this.calcForcesMapping();
			semiMapping = [];
			
			const dataLength = this.data.length / 4;
			const selectedForce = this.forces[this.selected_force_id];
		
			for (let i = 0; i < dataLength; i++) {
				
				const y = Math.floor(i / this.width);
				const x = i - y * this.width;
				const fIncs = this.calcForceIncs(x, y, selectedForce);
				
				semiMapping.push({
					x: this.incMapCache[i].x - fIncs.x,
					y: this.incMapCache[i].y - fIncs.y,
				});
			}

		});
		overlay.addEventListener('mouseup', () => { this.editing = false; });
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
				this.refresh();
			}
		};

		if (params.cpanel) {
			new MorphimgCpanel(this, params.cpanel);
		}

	}


	drawImg() {
		
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

		this.editing = true;
		//vamos a comprobar si hemos hecho click sobre una fuerza existente, en ese caso solo la seleccionaremos.
		
		const numForces = this.forces.length;
		const clickRadius = 7;
		for (let k = 0; k < numForces; k++) {
			const force = this.forces[k];
			if (Math.abs(mx - force.orig_x) < clickRadius && Math.abs(my - force.orig_y) < clickRadius) {
				this.selected_force_id = k;
				this.moving_node = 1;
				this.drawForces();
				return;
			}
			if (Math.abs(mx - force.dest_x) < clickRadius && Math.abs(my - force.dest_y) < clickRadius) {
				this.selected_force_id = k;
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

	calcForceIncs(x: number, y: number, force: IForce) {
		
		const uvmode = this.uvmode;
		const force_mult = this.force_mult;
		const focus_val = this.focus_val;

		const force_x = force.dest_x - force.orig_x;
		const force_y = force.dest_y - force.orig_y;	
		const dist = Math.sqrt(Math.pow(x - force.orig_x, 2) + Math.pow(y - force.orig_y, 2));
		//const dist = Math.sqrt(Math.pow(x - force.orig_x - force.dx, 2) + Math.pow(y - force.orig_y - force.dy, 2) );
		const morph = uvmode * force_mult / (dist * dist / 5 + focus_val);
		return {
			x: force_x * morph,
			y: force_y * morph
		};

	}

	refresh() {
		this.calcForcesMapping();
		this.render();
	}

	calcForcesMapping() {
		
		const width = this.width;
		const dataLength = this.data.length / 4;
		const forces = this.forces;
		const numForces = forces.length;

		this.incMapCache = [];

		for (let i = 0; i < dataLength; i++) {

			const y = Math.floor(i / width);
			const x = i - y * width;
			let incx = 0;
			let incy = 0;

			for (let k = 0; k < numForces; k++) {
				
				const fIncs = this.calcForceIncs(x, y, forces[k]);
				incx += fIncs.x;
				incy += fIncs.y;

			}

			this.incMapCache.push({ x: incx, y: incy });

		}
	}

	data: Uint8ClampedArray;

	render() {

		const ctx = this.ctx;
		const width = this.width;
		const height = this.height;

		const data = this.data;
		const newImageData = ctx.createImageData(width, height);
		const newdata = newImageData.data;

		const dataLength = data.length / 4;
		
		const percentage = this.percentage;

		for (let i = 0; i < dataLength; i++) {

			const y = Math.floor(i / width);
			const x = i - y * width;

			const mapping = this.incMapCache[i];
			let newx = x + percentage * mapping.x;
			let newy = y + percentage * mapping.y;
		
			newx = Math.max(Math.min(Math.floor(newx), width - 1), 0);
			newy = Math.max(Math.min(Math.floor(newy), height - 1), 0);

			
			const offset_pos = (y * width + x) * 4 ;
			const offset_pos_n = (newy * width + newx) * 4;
			for (let k = 0; k < 4; k++)
				if (this.uvmode === 1)
					newdata[offset_pos_n + k] = data[offset_pos + k];
				else
					newdata[offset_pos + k] = data[offset_pos_n + k];
			//map[2 * (y * width + x)] = newx;
			//map[2 * (y * width + x) + 1] = newy;
		}
		
		ctx.putImageData(newImageData, 0, 0);

	}

	animate() {

		if (this.animating) return;
		this.animating = true;
		this.percentage = 0;
		//let gr = 0;
		const animation = () => {
			if (!this.animating) return;
			this.percentage += 0.001 * this.animation_speed;//;1 - Math.pow(Math.sin(gr += 0.015), 6);
			this.render();
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
		this.refresh();

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
