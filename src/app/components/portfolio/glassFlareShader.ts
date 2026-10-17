// Six short diffraction rays are extracted from bright glass points at half
// resolution. Blue sky and cream background beams stay below the HDR gate.
export const glassFlareShader = `
  uniform sampler2D uScene;
  uniform vec2 uResolution;
  varying vec2 vUv;
  vec3 bright(vec2 uv) {
    vec3 c=texture2D(uScene,clamp(uv,0.001,0.999)).rgb;
    float y=dot(c,vec3(0.2126,0.7152,0.0722));
    return c*smoothstep(2.3,3.5,y);
  }
  vec3 ray(vec2 direction) {
    vec3 sum=vec3(0.0);
    for(int i=1;i<=7;i++) {
      float t=float(i);
      vec2 offset=direction*(t+t*t*0.2)/uResolution*2.4;
      float weight=exp(-t*0.38)*0.16;
      vec3 warmth=mix(vec3(1.0),vec3(1.0,0.78,0.5),t/12.0);
      sum+=(bright(vUv+offset)+bright(vUv-offset))*weight*warmth;
    }
    return sum;
  }
  void main(){
    vec3 glow=ray(vec2(0.0,1.0));
    glow+=ray(vec2(0.866,0.5));
    glow+=ray(vec2(0.866,-0.5));
    gl_FragColor=vec4(glow,1.0);
  }
`;
