const assetPathPrefix = "./assets";
const imgEllipse = `${assetPathPrefix}/0e2e3.svg`;

export default function ToastResi() {
  return (
    <div className="bg-white border border-[#eae2d9] border-solid overflow-clip relative rounded-[16px] shadow-[0px_10px_28px_0px_rgba(36,23,18,0.14)] size-full" data-node-id="124:11" data-name="Toast - Resi">
      <div className="absolute left-[23px] size-[40px] top-[29px]" data-node-id="124:12" data-name="Ellipse">
        <img alt="" className="absolute block inset-0 max-w-none size-full" src={imgEllipse} />
      </div>
      <p className="-translate-x-1/2 [word-break:break-word] absolute font-['Inter:Bold'] font-bold h-[10px] leading-[normal] left-[43px] not-italic text-[20px] text-center text-white top-[37px] w-[40px]" data-node-id="124:13">
        ✓
      </p>
      <p className="[word-break:break-word] absolute font-['Inter:Bold'] font-bold h-[10px] leading-[normal] left-[79px] not-italic text-[#241812] text-[16px] top-[31px] w-[350px]" data-node-id="124:14">
        Resi disalin
      </p>
      <p className="[word-break:break-word] absolute font-['Inter:Regular'] font-normal h-[10px] leading-[normal] left-[79px] not-italic text-[#8c8075] text-[13px] top-[57px] w-[350px]" data-node-id="124:15">
        Nomor resi berhasil disalin ke papan klip.
      </p>
      <button className="absolute bg-[#fbf6f0] block border border-[#eae2d9] border-solid cursor-pointer h-[40px] left-[335px] overflow-clip rounded-[10px] top-[85px] w-[100px]" data-node-id="124:16" data-name="btn Tutup">
        <p className="-translate-x-1/2 [word-break:break-word] absolute font-['Inter:Semi_Bold'] font-semibold h-[10px] leading-[normal] left-[49px] not-italic text-[#5c3d2e] text-[14px] text-center top-[10px] w-[100px]" data-node-id="124:17">
          Tutup
        </p>
      </button>
    </div>
  );
}