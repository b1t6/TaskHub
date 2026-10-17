export function fileToAvatar(file: File): Promise<string> {
  if (!file.type.startsWith("image/")) {
    return Promise.reject(new Error("请选择图片文件"));
  }
  if (file.size > 8 * 1024 * 1024) {
    return Promise.reject(new Error("图片不能超过 8MB"));
  }
  return new Promise((resolve, reject) => {
    const image = new Image();
    const url = URL.createObjectURL(file);
    image.onload = () => {
      const size = 160;
      const canvas = document.createElement("canvas");
      canvas.width = size;
      canvas.height = size;
      const ctx = canvas.getContext("2d");
      if (!ctx) {
        URL.revokeObjectURL(url);
        reject(new Error("无法处理图片"));
        return;
      }
      const scale = Math.max(size / image.width, size / image.height);
      const width = image.width * scale;
      const height = image.height * scale;
      ctx.drawImage(image, (size - width) / 2, (size - height) / 2, width, height);
      URL.revokeObjectURL(url);
      resolve(canvas.toDataURL("image/jpeg", 0.72));
    };
    image.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("图片无法读取"));
    };
    image.src = url;
  });
}
