# morphimg

A lightweight image morphing & animating tool for the web browser.

Try it out in the [demo playground](https://games.copinstar.com/morphimg).

## Basic usage

```js
import Morphimg from 'morphimg';

const mph = new Morphimg({
    wrapper: document.getElementById('morphimg-wr'),
    width: 500,
    height: 500,
    src: '/url/to/my/test/image.png',
    // You can also generate the built-in control panel as follows
    // (this param is optional and usually is only used for testing purposes)
    cpanel: {
        wrapper: document.getElementById('morphimg-cpanel-wr'),
        // You can specify extra testImgs for testing (this param is optional)
        testImgs: [
            { src: '/url/to/my/test/image2.png', label: 'Image2' },
            { src: '/url/to/my/test/image3.png', label: 'Image3' },
        ]
    }
});
    
```
