uniform sampler2D uTexture;
uniform sampler2D uEditor;
uniform vec2 uEditorUvScale;
uniform float uMessageIntensity;

varying vec2 vUv;
varying float vScrollIntensity;
varying float vMessageIntensity;

void main() {
    vec4 color = texture2D(uTexture, vUv);

    // Right monitor (vScrollIntensity = 1): the live code editor canvas, its UV rect
    // in the atlas remapped to the canvas' full 0..1 range.
    if (vScrollIntensity > 0.5) {
        color = texture2D(uEditor, vUv / uEditorUvScale);
    }

    vec2 messageUv = vec2(vUv.x, vUv.y + 0.5);
    vec4 messageColor = texture2D(uTexture, messageUv);

    color = mix(color, messageColor, vMessageIntensity * messageColor.a * uMessageIntensity);

    gl_FragColor = vec4(color.rgb, 1.0);
}