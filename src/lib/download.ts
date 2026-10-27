/** data URL을 파일로 내려받는다. 결과 카드와 기록 화면이 같은 방식을 쓴다. */
export function downloadDataUrl(dataUrl: string, fileName: string): void {
  const link = document.createElement('a');
  link.href = dataUrl;
  link.download = fileName;
  document.body.appendChild(link);
  link.click();
  link.remove();
}
