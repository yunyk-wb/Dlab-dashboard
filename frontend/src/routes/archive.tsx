import { createFileRoute } from "@tanstack/react-router"
import { useState, useRef, useEffect } from "react"
import "../archive.css"

interface Asset {
  id: number
  title: string
  brand: string
  cat: string
  type: string
  media: "image" | "video" | "carousel"
  status: string
  fileURL: string | null
  carouselURLs?: string[]
  carouselNames?: string[]
  year: string
  group?: string    // 소구점 폴더명 (Drive 업로드 시 자동 저장)
  taskName?: string // 과제명 (type === "과제" 일 때만 사용)
}

interface DriveFolderItem {
  folderId: string
  folderName: string
  files: { id: string; name: string; mimeType: string }[]
  mode: "carousel" | "single"
}

interface BrandInfo {
  name: string
  cat: string
  total: number
  imgCount: number
  vidCount: number
  status: string
  hasTasks: boolean
}

const CAT_CLASS: Record<string, string> = {
  "Beauty&Luxury":      "beauty",
  "F&B":                "fb",
  "Ecommerce":          "ecom",
  "Gaming":             "gaming",
  "Telecom":            "telecom",
  "Ent.&Media":         "ent",
  "Technology":         "tech",
  "Education":          "edu",
  "Sports":             "sports",
  "Automotive":         "auto",
  "Health Care":        "health",
  "Travel":             "travel",
  "Retail":             "retail",
  "Organizations":      "org",
  "Financial Services": "finance",
  "Service":            "service",
}
const CAT_COLOR: Record<string, string> = {
  "Beauty&Luxury":      "var(--cat-beauty)",
  "F&B":                "var(--cat-fb)",
  "Ecommerce":          "var(--cat-ecom)",
  "Gaming":             "var(--cat-gaming)",
  "Telecom":            "var(--cat-telecom)",
  "Ent.&Media":         "var(--cat-ent)",
  "Technology":         "var(--cat-tech)",
  "Education":          "var(--cat-edu)",
  "Sports":             "var(--cat-sports)",
  "Automotive":         "var(--cat-auto)",
  "Health Care":        "var(--cat-health)",
  "Travel":             "var(--cat-travel)",
  "Retail":             "var(--cat-retail)",
  "Organizations":      "var(--cat-org)",
  "Financial Services": "var(--cat-finance)",
  "Service":            "var(--cat-service)",
}
const CAT_ICON: Record<string, string> = {
  "Beauty&Luxury":      "ti-diamond",
  "F&B":                "ti-salad",
  "Ecommerce":          "ti-shopping-cart",
  "Gaming":             "ti-device-gamepad-2",
  "Telecom":            "ti-device-mobile",
  "Ent.&Media":         "ti-device-tv",
  "Technology":         "ti-cpu",
  "Education":          "ti-school",
  "Sports":             "ti-trophy",
  "Automotive":         "ti-car",
  "Health Care":        "ti-heart-rate-monitor",
  "Travel":             "ti-plane",
  "Retail":             "ti-building-store",
  "Organizations":      "ti-building-community",
  "Financial Services": "ti-building-bank",
  "Service":            "ti-tool",
}
const CATS = [
  "Beauty&Luxury", "F&B", "Ecommerce", "Gaming", "Telecom",
  "Ent.&Media", "Technology", "Education", "Sports", "Automotive",
  "Health Care", "Travel", "Retail", "Organizations", "Financial Services", "Service",
]
const FIXED_YEARS = ["2026", "2025", "2024"]

// 웹에서 표시 가능한 이미지/영상만 허용 (PSD, RAW, TIFF 등 제외)
const SKIP_MIME = new Set([
  "image/vnd.adobe.photoshop", "image/x-photoshop",
  "image/tiff", "image/x-tiff",
  "image/x-raw", "image/x-canon-cr2", "image/x-nikon-nef", "image/x-sony-arw",
  "image/x-adobe-dng",
])
// 확장자 기반 폴백 (Google Drive가 application/octet-stream 등 비표준 mimeType을 반환할 때 사용)
const IMAGE_EXTS = new Set(['.jpg', '.jpeg', '.png', '.gif', '.webp', '.bmp', '.svg', '.avif'])
const VIDEO_EXTS = new Set(['.mp4', '.mov', '.avi', '.mkv', '.webm', '.mpeg', '.m4v', '.wmv'])
const SKIP_EXTS = new Set(['.psd', '.psb', '.tiff', '.tif', '.raw', '.cr2', '.nef', '.arw', '.dng', '.ai', '.eps'])

const getExt = (name: string) => {
  const m = name.match(/(\.[^.]+)$/)
  return m ? m[1].toLowerCase() : ''
}
const isImageFile = (mime: string, name = '') =>
  mime.startsWith("image/") || IMAGE_EXTS.has(getExt(name))
const isVideoFile = (mime: string, name = '') =>
  mime.startsWith("video/") || mime === "application/mp4" || VIDEO_EXTS.has(getExt(name))

// 이미지/영상 mimeType 판별 — mimeType 우선, 확장자 폴백 (PSD·RAW 등 제외)
const isWebMedia = (mime: string, name = '') => {
  if (SKIP_MIME.has(mime)) return false
  const ext = getExt(name)
  if (SKIP_EXTS.has(ext)) return false
  return isImageFile(mime, name) || isVideoFile(mime, name)
}

const DEMO: Asset[] = []

export const Route = createFileRoute("/archive")({
  component: DesignArchivePage,
})

function DesignArchivePage() {
  const [assets, setAssets] = useState<Asset[]>(DEMO)
  const [selYear, setSelYear] = useState("all")
  const [selBrand, setSelBrand] = useState("all")
  const [selCat, setSelCat] = useState("all")
  const [mainView, setMainView] = useState<"home" | "year" | "type" | "category">("year")
  const [filters, setFilters] = useState({ type: "all" })
  const [selStatus, setSelStatus] = useState("all")
  const [searchQ, setSearchQ] = useState("")
  const [uploadOpen, setUploadOpen] = useState(false)
  const [statusOpen, setStatusOpen] = useState(false)
  const [lbOpen, setLbOpen] = useState(false)
  const [lbList, setLbList] = useState<Asset[]>([])
  const [lbIdx, setLbIdx] = useState(0)
  const [pendingFiles, setPendingFiles] = useState<{ file: File; url: string }[]>([])
  const [statusTarget, setStatusTarget] = useState("")
  const [uBrand, setUBrand] = useState("")
  const [uCat, setUCat] = useState(CATS[0])
  const [uType, setUType] = useState("비딩")
  const [uStatus, setUStatus] = useState("-")
  const [uTaskName, setUTaskName] = useState("")
  const [uYear, setUYear] = useState(String(new Date().getFullYear()))
  const [uploadMode, setUploadMode] = useState<"single" | "carousel" | "drive">("single")
  const [driveUrl, setDriveUrl] = useState("")
  const [driveApiKey, setDriveApiKey] = useState(() => {
    try { return localStorage.getItem("da_drive_api_key") || "" } catch { return "" }
  })
  const [driveLoading, setDriveLoading] = useState(false)
  const [drivePreview, setDrivePreview] = useState<DriveFolderItem[]>([])
  const [drivePreviewReady, setDrivePreviewReady] = useState(false)
  // Edit modal
  const [editOpen, setEditOpen] = useState(false)
  const [editTarget, setEditTarget] = useState<Asset | null>(null)
  const [eName, setEName] = useState("")
  const [eBrand, setEBrand] = useState("")
  const [eYear, setEYear] = useState("")
  const [eCat, setECat] = useState(CATS[0])
  const [eType, setEType] = useState("비딩")
  const [eStatus, setEStatus] = useState("-")
  const [eTaskName, setETaskName] = useState("")
  const nextId = useRef(100)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // light-theme body override while on this page
  useEffect(() => {
    const prev = document.body.style.cssText
    document.body.style.background = "#F5F4F0"
    document.body.style.color = "#1A1917"
    return () => { document.body.style.cssText = prev }
  }, [])

  // lightbox keyboard navigation
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (!lbOpen) return
      if (e.key === "ArrowLeft") setLbIdx(i => Math.max(0, i - 1))
      if (e.key === "ArrowRight") setLbIdx(i => Math.min(lbList.length - 1, i + 1))
      if (e.key === "Escape") setLbOpen(false)
    }
    document.addEventListener("keydown", handler)
    return () => document.removeEventListener("keydown", handler)
  }, [lbOpen, lbList.length])

  // 검색어 입력 시 홈 뷰로 자동 전환 (전체 소재 검색)
  useEffect(() => {
    if (searchQ) {
      setMainView("home")
      setSelBrand("all")
      setSelYear("all")
      setSelCat("all")
      setFilters(f => ({ ...f, type: "all" }))
    }
  }, [searchQ])

  function getBrandsMap(list: Asset[] = assets): Record<string, BrandInfo> {
    const m: Record<string, BrandInfo> = {}
    list.forEach(a => {
      if (!m[a.brand]) m[a.brand] = { name: a.brand, cat: a.cat, total: 0, imgCount: 0, vidCount: 0, status: "-", hasTasks: false }
      m[a.brand].total++
      m[a.brand].imgCount += a.media === "image" ? 1 : 0
      m[a.brand].vidCount += a.media === "video" ? 1 : 0
      if (a.type === "과제") m[a.brand].hasTasks = true
      // 비딩 소재만 수주 상태 집계 (과제 소재는 수주 상태 뱃지 미표시)
      if (a.type !== "과제") {
        const priority: Record<string, number> = { "수주": 3, "수주취소": 2, "드롭": 1, "-": 0 }
        if ((priority[a.status] ?? 0) > (priority[m[a.brand].status] ?? 0)) {
          m[a.brand].status = a.status
        }
      }
    })
    return m
  }

  function getYears(): string[] {
    return FIXED_YEARS
  }

  function getFiltered(brandOverride?: string, yearOverride?: string): Asset[] {
    const brand = brandOverride !== undefined ? brandOverride : selBrand
    const year = yearOverride !== undefined ? yearOverride : selYear
    return assets.filter(a => {
      const q = searchQ.toLowerCase()
      if (q && !a.title.toLowerCase().includes(q) && !a.brand.toLowerCase().includes(q)) return false
      if (year !== "all" && a.year !== year) return false
      if (brand !== "all" && a.brand !== brand) return false
      if (filters.type !== "all" && a.type !== filters.type) return false
      if (selCat !== "all" && a.cat !== selCat) return false
      return true
    })
  }

  // 사이드바 네비게이션 헬퍼
  function navHome()     { setMainView("home");     setSelYear("all"); setSelBrand("all"); setSelCat("all"); setFilters(f => ({ ...f, type: "all" })); setSelStatus("all"); setSearchQ("") }
  function navYear()     { setMainView("year");     setSelYear("all"); setSelBrand("all"); setSelCat("all") }
  function navType()     { setMainView("type");     setFilters(f => ({ ...f, type: "all" })); setSelBrand("all"); setSelCat("all") }
  function navCategory() { setMainView("category"); setSelCat("all"); setSelBrand("all") }

  // 카테고리 필터 토글 — 연도·유형 필터와 조합 가능
  function navCatFilter(cat: string) {
    if (selCat === cat) {
      setSelCat("all")          // 같은 카테고리 재클릭 → 해제
      return
    }
    setSelCat(cat)
    setSelBrand("all")
    // 연도·유형 필터가 없는 경우에만 카테고리 뷰로 전환 (AllBrandsView 표시)
    if (selYear === "all" && filters.type === "all") {
      setMainView("category")
    }
    // 연도·유형 필터가 있는 경우: mainView 유지, getFiltered()에서 cat 추가 필터 자동 적용
  }

  const [yearDropOpen, setYearDropOpen] = useState(false)
  const [typeDropOpen, setTypeDropOpen] = useState(false)
  const [catDropOpen, setCatDropOpen] = useState(false)

  function openUpload() {
    setPendingFiles([])
    setUBrand("")
    setUCat(CATS[0])
    setUType("비딩")
    setUStatus("-")
    setUTaskName("")
    setUYear(selYear !== "all" ? selYear : String(new Date().getFullYear()))
    setUploadMode("single")
    setDriveUrl("")
    setDriveLoading(false)
    setDrivePreview([])
    setDrivePreviewReady(false)
    setUploadOpen(true)
  }

  function handleFiles(files: FileList | null) {
    if (!files) return
    Array.from(files).forEach(file => {
      setPendingFiles(prev => [...prev, { file, url: URL.createObjectURL(file) }])
    })
  }

  function removeFile(idx: number) {
    setPendingFiles(prev => {
      URL.revokeObjectURL(prev[idx].url)
      return prev.filter((_, i) => i !== idx)
    })
  }

  function doUpload() {
    if (!uBrand.trim()) { alert("브랜드명을 입력해주세요"); return }
    if (!pendingFiles.length) { alert("파일을 추가해주세요"); return }
    if (uploadMode === "carousel" && pendingFiles.length < 2) { alert("캐러셀은 2장 이상 선택해주세요"); return }

    let newAssets: Asset[]
    if (uploadMode === "carousel") {
      const sorted = [...pendingFiles].sort((a, b) =>
        a.file.name.localeCompare(b.file.name, undefined, { numeric: true, sensitivity: "base" })
      )
      const urls = sorted.map(({ url }) => url)
      newAssets = [{
        id: nextId.current++,
        title: sorted[0].file.name.replace(/\.[^.]+$/, ""),
        brand: uBrand.trim(),
        cat: uCat,
        type: uType,
        status: uType === "과제" ? "-" : uStatus,
        media: "carousel",
        fileURL: urls[0],
        carouselURLs: urls,
        carouselNames: sorted.map(({ file }) => file.name.replace(/\.[^.]+$/, "")),
        year: uYear.trim() || String(new Date().getFullYear()),
        taskName: uType === "과제" ? uTaskName.trim() || undefined : undefined,
      }]
    } else {
      newAssets = pendingFiles.map(({ file, url }) => ({
        id: nextId.current++,
        title: file.name.replace(/\.[^.]+$/, ""),
        brand: uBrand.trim(),
        cat: uCat,
        type: uType,
        status: uType === "과제" ? "-" : uStatus,
        media: file.type.startsWith("video") ? "video" : "image",
        fileURL: url,
        year: uYear.trim() || String(new Date().getFullYear()),
        taskName: uType === "과제" ? uTaskName.trim() || undefined : undefined,
      }))
    }
    setAssets(prev => [...prev, ...newAssets])
    setUploadOpen(false)
    setSelYear(uYear.trim() || String(new Date().getFullYear()))
    setSelBrand(uBrand.trim())
  }

  async function fetchDriveContents(folderId: string, key: string): Promise<{ id: string; name: string; mimeType: string }[]> {
    // supportsAllDrives + includeItemsFromAllDrives: 공유 드라이브(Shared Drive/Team Drive) 포함
    const url =
      `https://www.googleapis.com/drive/v3/files` +
      `?q=%27${folderId}%27+in+parents` +
      `&fields=files(id%2Cname%2CmimeType)` +
      `&pageSize=200` +
      `&supportsAllDrives=true` +
      `&includeItemsFromAllDrives=true` +
      `&key=${encodeURIComponent(key)}`
    const res = await fetch(url)
    if (!res.ok) {
      const e = await res.json().catch(() => ({}))
      throw new Error((e as any).error?.message || `HTTP ${res.status}`)
    }
    return (await res.json()).files || []
  }

  async function checkDriveFolder() {
    if (!driveUrl.trim()) { alert("구글 드라이브 폴더 링크를 입력해주세요"); return }
    const key = driveApiKey.trim()
    if (!key) { alert("Google API 키를 입력해주세요"); return }
    const match = driveUrl.match(/\/folders\/([a-zA-Z0-9_-]+)/)
    if (!match) { alert("올바른 폴더 링크를 입력해주세요"); return }
    const rootId = match[1]

    setDriveLoading(true)
    setDrivePreview([])
    setDrivePreviewReady(false)
    try {
      type DriveFile = { id: string; name: string; mimeType: string }
      const nsort = (arr: DriveFile[]) =>
        [...arr].sort((a, b) => a.name.localeCompare(b.name, undefined, { numeric: true, sensitivity: "base" }))

      // 파일 배열을 이미지/영상으로 나눠 DriveFolderItem 배열로 변환
      const toGroups = (files: DriveFile[], groupName: string, isCarousel: boolean): DriveFolderItem[] => {
        const imgs = nsort(files.filter(f => isImageFile(f.mimeType, f.name)))
        const vids = nsort(files.filter(f => isVideoFile(f.mimeType, f.name)))
        const mixed = imgs.length > 0 && vids.length > 0
        const result: DriveFolderItem[] = []
        if (imgs.length) result.push({
          folderId: groupName,
          folderName: mixed ? `${groupName} · 이미지` : groupName,
          files: imgs,
          mode: isCarousel ? "carousel" : "single",
        })
        if (vids.length) result.push({
          folderId: groupName,
          folderName: mixed ? `${groupName} · 영상` : groupName,
          files: vids,
          mode: "single",
        })
        return result
      }

      const rootContents = await fetchDriveContents(rootId, key)
      const subFolders = rootContents.filter(f => f.mimeType === "application/vnd.google-apps.folder")
      const rootMedia = rootContents.filter(f => isWebMedia(f.mimeType, f.name))

      const items: DriveFolderItem[] = []

      if (subFolders.length > 0) {
        // 하위 폴더가 있는 경우: JPG·MP4만 인식, PSD 등 비지원 폴더는 자동 제외
        // 구조 예시: Root → JPG/(캐러셀/, 단일/) → 파일들  (2단계 깊이 지원)
        const folderErrors: string[] = []
        for (const folder of subFolders) {
          let contents: { id: string; name: string; mimeType: string }[] = []
          try {
            contents = await fetchDriveContents(folder.id, key)
          } catch (e: unknown) {
            folderErrors.push(`"${folder.name}": ${e instanceof Error ? e.message : String(e)}`)
            continue
          }

          const directMedia = contents.filter(f => isWebMedia(f.mimeType, f.name))
          const innerFolders = contents.filter(f => f.mimeType === "application/vnd.google-apps.folder")

          if (directMedia.length > 0) {
            // ① 이 폴더에 파일이 직접 있는 경우 (1단계)
            const isCarousel = /캐러셀|carousel/i.test(folder.name)
            items.push(...toGroups(directMedia, folder.name, isCarousel))

          } else if (innerFolders.length > 0) {
            // ② 하위 폴더 있음 → 한 단계 더 들어감 (2단계)
            for (const inner of innerFolders) {
              let innerContents: { id: string; name: string; mimeType: string }[] = []
              try {
                innerContents = await fetchDriveContents(inner.id, key)
              } catch (e: unknown) {
                folderErrors.push(`"${folder.name}/${inner.name}": ${e instanceof Error ? e.message : String(e)}`)
                continue
              }

              const innerMedia = innerContents.filter(f => isWebMedia(f.mimeType, f.name))
              const deepFolders = innerContents.filter(f => f.mimeType === "application/vnd.google-apps.folder")

              if (innerMedia.length > 0) {
                // ② 파일이 직접 있음
                const isCarousel = /캐러셀|carousel/i.test(inner.name)
                items.push(...toGroups(innerMedia, inner.name, isCarousel))

              } else if (deepFolders.length > 0) {
                // ③ 한 단계 더 들어감 (3단계: 소구점폴더 → 단일/캐러셀폴더 → 파일)
                for (const deep of deepFolders) {
                  let deepContents: { id: string; name: string; mimeType: string }[] = []
                  try {
                    deepContents = await fetchDriveContents(deep.id, key)
                  } catch (e: unknown) {
                    folderErrors.push(`"${folder.name}/${inner.name}/${deep.name}": ${e instanceof Error ? e.message : String(e)}`)
                    continue
                  }
                  const deepMedia = deepContents.filter(f => isWebMedia(f.mimeType, f.name))
                  if (!deepMedia.length) continue
                  // 그룹명: 소구점명 (단일 폴더만 있으면) or "소구점 · 단일/캐러셀" (여러 개)
                  const groupName = deepFolders.length > 1
                    ? `${inner.name} · ${deep.name}`
                    : inner.name
                  const isCarousel = /캐러셀|carousel/i.test(deep.name) || /캐러셀|carousel/i.test(inner.name)
                  items.push(...toGroups(deepMedia, groupName, isCarousel))
                }
              }
            }
          }
          // else: 빈 폴더 또는 PSD만 있는 폴더 → 건너뜀
        }
        // 최상위에 지원 파일도 있으면 추가
        if (rootMedia.length) items.push(...toGroups(rootMedia, "최상위", false))

        // 폴더를 찾았지만 아무것도 등록되지 않은 경우
        if (!items.length) {
          if (folderErrors.length) {
            alert(`폴더 접근 중 오류가 발생했습니다:\n\n${folderErrors.join("\n")}\n\nAPI 키가 유효한지 확인하거나, Drive API 콘솔에서 제한 설정을 확인해주세요.`)
          } else {
            alert("지원 형식 파일을 찾을 수 없습니다.\nJPG/PNG/MP4 파일이 있는지, 폴더 공유 설정이 '링크가 있는 모든 사용자'인지 확인해주세요.")
          }
          return
        }
      } else {
        // 하위 폴더 없음: JPG(이미지)와 MP4(영상)를 자동으로 분리
        const imgs = nsort(rootMedia.filter(f => f.mimeType.startsWith("image/")))
        const vids = nsort(rootMedia.filter(f => f.mimeType.startsWith("video/")))
        if (!imgs.length && !vids.length) {
          alert("이미지/영상 파일이 없거나 폴더 접근 권한이 없습니다.\n'링크가 있는 모든 사용자' 공유로 설정되어 있는지 확인해주세요.")
          return
        }
        if (imgs.length) items.push({ folderId: rootId, folderName: "이미지", files: imgs, mode: "single" })
        if (vids.length) items.push({ folderId: rootId, folderName: "영상", files: vids, mode: "single" })
      }

      if (!items.length) { alert("등록 가능한 파일이 없습니다."); return }
      try { localStorage.setItem("da_drive_api_key", key) } catch { /* ignore */ }
      setDrivePreview(items)
      setDrivePreviewReady(true)
    } catch (err: unknown) {
      alert(`폴더 확인 실패: ${err instanceof Error ? err.message : String(err)}`)
    } finally {
      setDriveLoading(false)
    }
  }

  function doDriveUploadFromPreview() {
    if (!uBrand.trim()) { alert("브랜드명을 입력해주세요"); return }
    const targetYear = uYear.trim() || String(new Date().getFullYear())
    const brand = uBrand.trim()
    const newAssets: Asset[] = []

    for (const item of drivePreview) {
      // 소구점 폴더명: "폴더명 · 이미지" / "폴더명 · 영상" 접미사 제거 → 순수 폴더명만 저장
      const group = item.folderName.replace(/\s*·\s*(이미지|영상)$/, "")
      if (item.mode === "carousel") {
        const urls = item.files.map(f => `https://lh3.googleusercontent.com/d/${f.id}`)
        newAssets.push({
          id: nextId.current++,
          title: item.folderName,
          brand, cat: uCat, type: uType,
          status: uType === "비딩" ? uStatus : "-",
          media: "carousel" as const,
          fileURL: urls[0], carouselURLs: urls,
          carouselNames: item.files.map(f => f.name.replace(/\.[^.]+$/, "")),
          year: targetYear,
          group,
          taskName: uType === "과제" ? uTaskName.trim() || undefined : undefined,
        })
      } else {
        for (const file of item.files) {
          newAssets.push({
            id: nextId.current++,
            title: file.name.replace(/\.[^.]+$/, ""),
            brand, cat: uCat, type: uType,
            status: uType === "비딩" ? uStatus : "-",
            media: isVideoFile(file.mimeType, file.name) ? "video" as const : "image" as const,
            fileURL: `https://lh3.googleusercontent.com/d/${file.id}`,
            year: targetYear,
            group,
            taskName: uType === "과제" ? uTaskName.trim() || undefined : undefined,
          })
        }
      }
    }

    setAssets(prev => [...prev, ...newAssets])
    setUploadOpen(false)
    setSelYear(targetYear)
    setSelBrand(brand)
  }

  function openStatus(brand: string) {
    const hasTasks = assets.some(a => a.brand === brand && a.type === "과제")
    if (!hasTasks) { alert("비딩 전용 브랜드는 수주 상태를 설정할 수 없습니다."); return }
    setStatusTarget(brand)
    setStatusOpen(true)
  }

  function doSetStatus(s: string) {
    setAssets(prev => prev.map(a => a.brand === statusTarget && a.type === "과제" ? { ...a, status: s } : a))
    setStatusOpen(false)
  }

  function deleteAsset(id: number) {
    setAssets(prev => prev.filter(a => a.id !== id))
  }

  function openEdit(asset: Asset) {
    setEditTarget(asset)
    setEName(asset.title)
    setEBrand(asset.brand)
    setEYear(asset.year)
    setECat(asset.cat)
    setEType(asset.type)
    setEStatus(asset.status)
    setETaskName(asset.taskName || "")
    setEditOpen(true)
  }

  function doEdit() {
    if (!editTarget) return
    if (!eName.trim()) { alert("소재명을 입력해주세요"); return }
    if (!eBrand.trim()) { alert("브랜드명을 입력해주세요"); return }
    setAssets(prev => prev.map(a => a.id === editTarget.id ? {
      ...a,
      title: eName.trim(),
      brand: eBrand.trim(),
      year: eYear,
      cat: eCat,
      type: eType,
      status: eType === "과제" ? "-" : eStatus,
      taskName: eType === "과제" ? eTaskName.trim() || undefined : undefined,
    } : a))
    setEditOpen(false)
    setEditTarget(null)
  }

  function deleteFolder(brand: string) {
    setAssets(prev => prev.filter(a => !(a.brand === brand && (selYear === "all" || a.year === selYear))))
    setSelBrand("all")
  }

  function openLightbox(idx: number, list: Asset[]) {
    const asset = list[idx]
    if (asset.media === "carousel" && asset.carouselURLs?.length) {
      const subList: Asset[] = asset.carouselURLs.map((url, i) => ({
        id: asset.id * 10000 + i,
        title: `${asset.carouselNames?.[i] ?? asset.title} (${i + 1}/${asset.carouselURLs!.length})`,
        brand: asset.brand,
        cat: asset.cat,
        type: asset.type,
        media: "image" as const,
        status: asset.status,
        fileURL: url,
        year: asset.year,
      }))
      setLbList(subList)
      setLbIdx(0)
    } else {
      setLbList(list)
      setLbIdx(idx)
    }
    setLbOpen(true)
  }

  const yearList = getYears()
  const yearAssets = selYear === "all" ? assets : assets.filter(a => a.year === selYear)
  const bm = getBrandsMap(yearAssets)
  const filteredAll = (() => {
    const base = getFiltered()
    if (selStatus === "all") return base
    return base.filter(a => bm[a.brand]?.status === selStatus)
  })()


  return (
    <div className="da-root">
      <div className="app">
        {/* ── Sidebar ── */}
        <aside className="sidebar">
          <div className="sidebar-header">
            <div className="logo">
              <div className="logo-mark"><i className="ti ti-layers-subtract" /></div>
              <span className="logo-text">Design Archive</span>
            </div>
            <div className="logo-sub">디자인본부 소재 아카이브</div>
          </div>

          <div className="sidebar-filters">
            {/* 홈 — 전체 소재 */}
            <button
              className={`sf-home-btn${mainView === "home" ? " active" : ""}`}
              onClick={navHome}
            >
              <i className="ti ti-home" />
              <span>전체 소재</span>
              <span className="sf-home-count">{assets.length}</span>
            </button>
            <div className="sf-divider" />

            {/* 연도 */}
            <div className="sf-section">
              <div className="sf-label">연도</div>
              <div className="sf-cat-group">
                <div className="sf-cat-header">
                  <span
                    className={`sf-nav-label${mainView === "year" ? " active" : ""}`}
                    onClick={() => setYearDropOpen(o => !o)}
                  >{selYear === "all" ? "전체" : selYear}</span>
                  <i
                    className={`ti ${yearDropOpen ? "ti-chevron-up" : "ti-chevron-down"} sf-cat-chevron`}
                    onClick={() => setYearDropOpen(o => !o)}
                  />
                </div>
                {yearDropOpen && (
                  <div className="sf-dropdown-opts">
                    {(["all", ...FIXED_YEARS] as const).map(y => (
                      <div
                        key={y}
                        className={`sf-dropdown-opt${selYear === y ? " on" : ""}`}
                        onClick={() => {
                          if (y === "all") { navYear(); } else { setSelYear(y); setSelBrand("all"); setMainView("year"); }
                          setYearDropOpen(false)
                        }}
                      >{y === "all" ? "전체" : y}</div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <div className="sf-divider" />

            {/* 유형 */}
            <div className="sf-section">
              <div className="sf-label">유형</div>
              <div className="sf-cat-group">
                <div className="sf-cat-header">
                  <span
                    className={`sf-nav-label${mainView === "type" ? " active" : ""}`}
                    onClick={() => setTypeDropOpen(o => !o)}
                  >{filters.type === "all" ? "전체" : filters.type}</span>
                  <i
                    className={`ti ${typeDropOpen ? "ti-chevron-up" : "ti-chevron-down"} sf-cat-chevron`}
                    onClick={() => setTypeDropOpen(o => !o)}
                  />
                </div>
                {typeDropOpen && (
                  <div className="sf-dropdown-opts">
                    {(["all", "비딩", "과제"] as const).map(t => (
                      <div
                        key={t}
                        className={`sf-dropdown-opt${filters.type === t ? " on" : ""}`}
                        onClick={() => {
                          if (t === "all") { navType(); } else { setFilters(f => ({ ...f, type: t })); setMainView("type"); setSelBrand("all"); setSelCat("all"); }
                          setTypeDropOpen(false)
                        }}
                      >{t === "all" ? "전체" : t}</div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <div className="sf-divider" />

            {/* 카테고리 */}
            <div className="sf-section">
              <div className="sf-label">카테고리</div>
              <div className="sf-cat-group">
                <div className="sf-cat-header">
                  <span
                    className={`sf-nav-label${selCat !== "all" || mainView === "category" ? " active" : ""}`}
                    onClick={() => setCatDropOpen(o => !o)}
                  >{selCat === "all" ? "전체" : selCat}</span>
                  <i
                    className={`ti ${catDropOpen ? "ti-chevron-up" : "ti-chevron-down"} sf-cat-chevron`}
                    onClick={() => setCatDropOpen(o => !o)}
                  />
                </div>
                {catDropOpen && (
                  <div className="sf-dropdown-opts">
                    <div
                      className={`sf-dropdown-opt${selCat === "all" ? " on" : ""}`}
                      onClick={() => { navCategory(); setCatDropOpen(false) }}
                    >전체</div>
                    {CATS.map(c => (
                      <div
                        key={c}
                        className={`sf-dropdown-opt${selCat === c ? " on" : ""}`}
                        onClick={() => { navCatFilter(c); setCatDropOpen(false) }}
                      >{c}</div>
                    ))}
                  </div>
                )}
              </div>
            </div>

          </div>
        </aside>

        {/* ── Main ── */}
        <div className="main">
          <div className="topbar">
            <div className="search-wrap">
              <i className="ti ti-search" />
              <input
                className="search-input"
                type="text"
                placeholder="소재명, 브랜드 검색..."
                value={searchQ}
                onChange={e => setSearchQ(e.target.value)}
              />
            </div>
            <div className="topbar-right">
              <button className="btn-upload" onClick={openUpload}>
                <i className="ti ti-upload" /> 소재 업로드
              </button>
            </div>
          </div>

          <div className="content">
            {selBrand !== "all" ? (
              <FolderView
                brand={selBrand}
                year={selYear !== "all" ? selYear : undefined}
                allAssets={filteredAll}
                bm={bm}
                onBack={() => setSelBrand("all")}
                onOpenStatus={openStatus}
                onOpenLightbox={openLightbox}
                onDeleteAsset={deleteAsset}
                onEditAsset={openEdit}
                onDeleteFolder={deleteFolder}
              />
            ) : mainView === "home" ? (
              <HomeView
                assets={filteredAll}
                bm={bm}
                searchQ={searchQ}
                onSelectBrand={(brand, type) => {
                  setSelBrand(brand)
                  setFilters(f => ({ ...f, type }))
                }}
                onDeleteBrand={deleteFolder}
              />
            ) : mainView === "year" ? (
              selYear === "all" ? (
                <YearView
                  years={yearList}
                  assets={assets}
                  onSelectYear={y => { setSelYear(y); setSelBrand("all") }}
                />
              ) : (
                <AllBrandsView
                  year={selYear}
                  bm={bm}
                  filteredAssets={filteredAll}
                  onSelectBrand={setSelBrand}
                  onDeleteBrand={deleteFolder}
                  onBack={() => { setSelYear("all"); setSelBrand("all") }}
                  backLabel="연도 목록"
                />
              )
            ) : mainView === "type" ? (
              filters.type === "all" ? (
                <TypeView
                  assets={assets.filter(a => selYear === "all" || a.year === selYear)}
                  onSelectType={t => { setFilters(f => ({ ...f, type: t })); setSelBrand("all") }}
                />
              ) : (
                <AllBrandsView
                  year={selYear}
                  bm={bm}
                  filteredAssets={filteredAll}
                  onSelectBrand={setSelBrand}
                  onDeleteBrand={deleteFolder}
                  onBack={() => { setFilters(f => ({ ...f, type: "all" })); setSelBrand("all") }}
                  backLabel="유형 목록"
                  selStatus={filters.type === "비딩" ? selStatus : undefined}
                  onSetStatus={filters.type === "비딩" ? (v => setSelStatus(v)) : undefined}
                />
              )
            ) : (
              selCat === "all" ? (
                <CategoryView
                  assets={assets.filter(a => selYear === "all" || a.year === selYear)}
                  onSelectCat={c => { setSelCat(c); setSelBrand("all") }}
                />
              ) : (
                <AllBrandsView
                  year={selYear}
                  bm={bm}
                  filteredAssets={filteredAll}
                  onSelectBrand={setSelBrand}
                  onDeleteBrand={deleteFolder}
                  onBack={() => { setSelCat("all"); setSelBrand("all") }}
                  backLabel="카테고리 목록"
                />
              )
            )}
          </div>
        </div>
      </div>

      {/* ── Upload Modal ── */}
      {uploadOpen && (
        <div className="modal-overlay open" onClick={e => { if (e.target === e.currentTarget) setUploadOpen(false) }}>
          <div className="modal">
            <div className="modal-title"><i className="ti ti-upload" /> 소재 업로드</div>
            <div className="form-row">
              <label className="form-label">브랜드명</label>
              <input className="form-input" type="text" placeholder="예) 삼성전자, 아모레퍼시픽..." value={uBrand} onChange={e => setUBrand(e.target.value)} />
            </div>
            <div className="form-row">
              <label className="form-label">연도</label>
              <input className="form-input" type="text" placeholder="예) 2025" value={uYear} onChange={e => setUYear(e.target.value)} />
            </div>
            <div className="form-row">
              <label className="form-label">카테고리</label>
              <select className="form-select" value={uCat} onChange={e => setUCat(e.target.value)}>
                {CATS.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div className="form-row">
              <label className="form-label">유형</label>
              <div className="radio-group">
                {["비딩", "과제"].map(v => (
                  <label key={v} className="radio-label">
                    <input type="radio" name="utype" value={v} checked={uType === v} onChange={() => setUType(v)} />
                    {v}
                  </label>
                ))}
              </div>
            </div>
            {uType === "과제" && (
              <div className="form-row">
                <label className="form-label">과제명</label>
                <input className="form-input" type="text" placeholder="과제명을 입력하세요" value={uTaskName} onChange={e => setUTaskName(e.target.value)} />
              </div>
            )}
            {uType === "비딩" && (
              <div className="form-row">
                <label className="form-label">수주 상태</label>
                <select className="form-select" value={uStatus} onChange={e => setUStatus(e.target.value)}>
                  <option value="-">선택 안 함</option>
                  <option value="수주">수주</option>
                  <option value="수주취소">수주취소</option>
                  <option value="드롭">드롭</option>
                </select>
              </div>
            )}
            <div className="form-row">
              <label className="form-label">업로드 방식</label>
              <div className="upload-type-tabs">
                <button
                  type="button"
                  className={`upload-type-tab${uploadMode !== "drive" ? " active" : ""}`}
                  onClick={() => { if (uploadMode === "drive") setUploadMode("single") }}
                >
                  <i className="ti ti-photo" /> 소재
                </button>
                <button
                  type="button"
                  className={`upload-type-tab${uploadMode === "drive" ? " active" : ""}`}
                  onClick={() => setUploadMode("drive")}
                >
                  <i className="ti ti-brand-google-drive" /> 드라이브
                </button>
              </div>
              {uploadMode === "drive" && (
                <p className="form-hint visible">구글 드라이브 폴더 안의 이미지/영상이 개별 소재로 등록됩니다.</p>
              )}
            </div>

            {uploadMode === "drive" ? (
              <>
                <div className="form-row">
                  <label className="form-label">드라이브 폴더 링크</label>
                  <input
                    className="form-input"
                    type="text"
                    placeholder="https://drive.google.com/drive/folders/..."
                    value={driveUrl}
                    onChange={e => { setDriveUrl(e.target.value); setDrivePreviewReady(false); setDrivePreview([]) }}
                  />
                  <p className="form-hint visible">폴더를 '링크가 있는 모든 사용자' 공유로 설정해주세요.</p>
                </div>
                <div className="form-row">
                  <label className="form-label">Google API 키</label>
                  <input
                    className="form-input"
                    type="text"
                    placeholder="AIzaSy..."
                    value={driveApiKey}
                    onChange={e => setDriveApiKey(e.target.value)}
                  />
                  <p className="form-hint visible">Google Cloud Console → Drive API → 사용자 인증 정보에서 발급해주세요. 입력 후 자동 저장됩니다.</p>
                </div>

                {drivePreviewReady && drivePreview.length > 0 && (
                  <div className="form-row">
                    <label className="form-label">폴더 구조 확인</label>
                    <div className="drive-preview-list">
                      {drivePreview.map((item, idx) => (
                        <div key={idx} className="drive-preview-item">
                          <i className={`ti ${item.mode === "carousel" ? "ti-layout-columns" : "ti-photo"} drive-preview-icon`} />
                          <div className="drive-preview-info">
                            <span className="drive-preview-name">{item.folderName}</span>
                            <span className="drive-preview-count">{item.files.length}개 파일</span>
                          </div>
                          <button
                            className={`drive-mode-btn ${item.mode === "carousel" ? "mode-carousel" : "mode-single"}`}
                            onClick={() => setDrivePreview(prev => prev.map((p, i) =>
                              i === idx ? { ...p, mode: p.mode === "carousel" ? "single" : "carousel" } : p
                            ))}
                          >
                            {item.mode === "carousel" ? "캐러셀" : "단일"} <i className="ti ti-switch-horizontal" style={{ fontSize: 10 }} />
                          </button>
                          <span className="drive-preview-result">
                            → {item.mode === "carousel" ? "1개" : `${item.files.length}개`}
                          </span>
                        </div>
                      ))}
                      <div className="drive-preview-total">
                        총 {drivePreview.reduce((s, i) => s + (i.mode === "carousel" ? 1 : i.files.length), 0)}개 소재 등록 예정
                      </div>
                    </div>
                  </div>
                )}
              </>
            ) : (
              <div className="form-row">
                <label className="form-label">소재 파일</label>
                <div
                  className="drop-zone"
                  onClick={() => fileInputRef.current?.click()}
                  onDragOver={e => { e.preventDefault(); e.currentTarget.classList.add("drag-over") }}
                  onDragLeave={e => e.currentTarget.classList.remove("drag-over")}
                  onDrop={e => { e.preventDefault(); e.currentTarget.classList.remove("drag-over"); handleFiles(e.dataTransfer.files) }}
                >
                  <i className="ti ti-cloud-upload drop-zone-icon" />
                  <p>클릭하거나 드래그하여 파일 업로드</p>
                  <small>JPG, PNG, GIF, MP4, MOV 지원</small>
                </div>
                <input ref={fileInputRef} type="file" multiple accept={uploadMode === "carousel" ? "image/*" : "image/*,video/*"} style={{ display: "none" }} onChange={e => handleFiles(e.target.files)} />
                <div className="file-list">
                  {pendingFiles.map(({ file }, i) => {
                    const isVid = file.type.startsWith("video")
                    const size = file.size > 1e6 ? (file.size / 1e6).toFixed(1) + "MB" : (file.size / 1e3).toFixed(0) + "KB"
                    return (
                      <div key={i} className="file-item">
                        <i className={`ti ${isVid ? "ti-video" : "ti-photo"}`} />
                        <span className="file-item-name">{file.name}</span>
                        <span className="file-item-size">{size}</span>
                        <i className="ti ti-x file-item-rm" onClick={() => removeFile(i)} />
                      </div>
                    )
                  })}
                </div>
              </div>
            )}

            <div className="modal-actions">
              <button className="btn-cancel" onClick={() => setUploadOpen(false)}>취소</button>
              {uploadMode === "drive" ? (
                drivePreviewReady ? (
                  <button className="btn-primary" onClick={doDriveUploadFromPreview}>
                    업로드 ({drivePreview.reduce((s, i) => s + (i.mode === "carousel" ? 1 : i.files.length), 0)}개 소재)
                  </button>
                ) : (
                  <button className="btn-primary" onClick={checkDriveFolder} disabled={driveLoading}>
                    {driveLoading
                      ? <><i className="ti ti-loader-2" style={{ fontSize: 13, animation: "spin 1s linear infinite" }} /> 확인 중...</>
                      : <><i className="ti ti-folder-search" style={{ fontSize: 13 }} /> 폴더 확인</>
                    }
                  </button>
                )
              ) : (
                <button className="btn-primary" onClick={doUpload}>업로드</button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ── Status Modal ── */}
      {statusOpen && (
        <div className="modal-overlay open" onClick={e => { if (e.target === e.currentTarget) setStatusOpen(false) }}>
          <div className="status-modal-inner">
            <div style={{ fontSize: 14, fontWeight: 600, color: "var(--text)" }}>수주 상태 변경</div>
            <div style={{ fontSize: 12, color: "var(--text-3)", marginTop: 3 }}>{statusTarget}</div>
            <div className="status-opts">
              <div className="status-opt" onClick={() => doSetStatus("-")}><div className="dot" style={{ background: "var(--border-md)" }} />선택 안 함</div>
              <div className="status-opt" onClick={() => doSetStatus("수주")}><div className="dot dot-win" />수주</div>
              <div className="status-opt" onClick={() => doSetStatus("수주취소")}><div className="dot dot-cancel" />수주취소</div>
              <div className="status-opt" onClick={() => doSetStatus("드롭")}><div className="dot dot-hold" />드롭</div>
            </div>
            <div className="modal-actions">
              <button className="btn-cancel" onClick={() => setStatusOpen(false)}>취소</button>
            </div>
          </div>
        </div>
      )}

      {/* ── Edit Modal ── */}
      {editOpen && (
        <div className="modal-overlay open" onClick={e => { if (e.target === e.currentTarget) setEditOpen(false) }}>
          <div className="modal">
            <div className="modal-title"><i className="ti ti-edit" /> 소재 수정</div>
            <div className="form-row">
              <label className="form-label">소재명</label>
              <input className="form-input" type="text" placeholder="소재명을 입력하세요" value={eName} onChange={e => setEName(e.target.value)} />
            </div>
            <div className="form-row">
              <label className="form-label">브랜드명</label>
              <input className="form-input" type="text" placeholder="예) 삼성전자, 아모레퍼시픽..." value={eBrand} onChange={e => setEBrand(e.target.value)} />
            </div>
            <div className="form-row">
              <label className="form-label">연도</label>
              <input className="form-input" type="text" placeholder="예) 2025" value={eYear} onChange={e => setEYear(e.target.value)} />
            </div>
            <div className="form-row">
              <label className="form-label">카테고리</label>
              <select className="form-select" value={eCat} onChange={e => setECat(e.target.value)}>
                {CATS.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div className="form-row">
              <label className="form-label">유형</label>
              <div className="radio-group">
                {["비딩", "과제"].map(v => (
                  <label key={v} className="radio-label">
                    <input type="radio" name="etype" value={v} checked={eType === v} onChange={() => setEType(v)} />
                    {v}
                  </label>
                ))}
              </div>
            </div>
            {eType === "과제" && (
              <div className="form-row">
                <label className="form-label">과제명</label>
                <input className="form-input" type="text" placeholder="과제명을 입력하세요" value={eTaskName} onChange={e => setETaskName(e.target.value)} />
              </div>
            )}
            {eType === "비딩" && (
              <div className="form-row">
                <label className="form-label">수주 상태</label>
                <select className="form-select" value={eStatus} onChange={e => setEStatus(e.target.value)}>
                  <option value="-">선택 안 함</option>
                  <option value="수주">수주</option>
                  <option value="수주취소">수주취소</option>
                  <option value="드롭">드롭</option>
                </select>
              </div>
            )}
            <div className="modal-actions">
              <button className="btn-cancel" onClick={() => setEditOpen(false)}>취소</button>
              <button className="btn-primary" onClick={doEdit}><i className="ti ti-check" style={{ fontSize: 13 }} /> 저장</button>
            </div>
          </div>
        </div>
      )}

      {/* ── Lightbox ── */}
      {lbOpen && (
        <div className="lightbox open" onClick={e => { if (e.target === e.currentTarget) setLbOpen(false) }}>
          <button className="lb-close" onClick={() => setLbOpen(false)}><i className="ti ti-x" /></button>
          {lbIdx > 0 && (
            <button className="lb-nav lb-prev" onClick={() => setLbIdx(i => i - 1)}>
              <i className="ti ti-chevron-left" />
            </button>
          )}
          {lbIdx < lbList.length - 1 && (
            <button className="lb-nav lb-next" onClick={() => setLbIdx(i => i + 1)}>
              <i className="ti ti-chevron-right" />
            </button>
          )}
          <div className="lb-media">
            {lbList[lbIdx] && (() => {
              const cur = lbList[lbIdx]
              const driveViewUrl = toDriveViewUrl(cur.fileURL)
              const isDriveVideo = cur.media === "video" && !!driveViewUrl
              if (!cur.fileURL) return (
                <div className="lb-placeholder">
                  <i className={`ti ${cur.media === "video" ? "ti-video" : "ti-photo"}`} />
                  <p>미리보기 없음</p>
                </div>
              )
              if (isDriveVideo) {
                const driveId = extractDriveId(cur.fileURL)
                return (
                  <iframe
                    src={`https://drive.google.com/file/d/${driveId}/preview`}
                    allow="autoplay"
                    style={{ width: "70vw", height: "39vw", maxWidth: "85vw", maxHeight: "72vh", borderRadius: 10, border: "none" }}
                  />
                )
              }
              if (cur.media === "video") return (
                <video src={cur.fileURL} controls autoPlay style={{ maxWidth: "85vw", maxHeight: "75vh", borderRadius: 10 }} />
              )
              return (
                <img src={cur.fileURL} alt={cur.title} style={{ maxWidth: "85vw", maxHeight: "75vh", borderRadius: 10, objectFit: "contain" }} />
              )
            })()}
          </div>
          {lbList[lbIdx] && (
            <div className="lb-info">
              <div className="lb-name">{lbList[lbIdx].title}</div>
              <div className="lb-meta">
                {lbList[lbIdx].brand} · {lbList[lbIdx].cat} · {lbList[lbIdx].type}
                {lbList[lbIdx].status !== "-" ? ` · ${lbList[lbIdx].status}` : ""}
              </div>
              <div className="lb-bottom-row">
                <div className="lb-counter">{lbIdx + 1} / {lbList.length}</div>
                {toDriveViewUrl(lbList[lbIdx].fileURL) && (
                  <a
                    className="lb-drive-btn"
                    href={toDriveViewUrl(lbList[lbIdx].fileURL)!}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={e => e.stopPropagation()}
                  >
                    <i className="ti ti-brand-google-drive" />
                    드라이브에서 보기
                  </a>
                )}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

// Drive lh3 URL에서 파일 ID 추출
function extractDriveId(fileURL: string | null | undefined): string | null {
  if (!fileURL) return null
  const m = fileURL.match(/lh3\.googleusercontent\.com\/d\/([^?&/]+)/)
  return m ? m[1] : null
}
// Drive lh3 URL → google drive 파일 보기 링크
function toDriveViewUrl(fileURL: string | null | undefined): string | null {
  const id = extractDriveId(fileURL)
  return id ? `https://drive.google.com/file/d/${id}/view` : null
}
// Drive 비디오용 썸네일 URL (lh3는 이미지 전용이라 video 태그로 재생 불가)
function toDriveThumbnailUrl(fileURL: string | null | undefined): string | null {
  const id = extractDriveId(fileURL)
  return id ? `https://drive.google.com/thumbnail?id=${id}&sz=w400` : null
}

function AssetCard({ asset, idx, list, onOpen, onDelete, onEdit, isSelected = false, onToggleSelect, anySelected = false, showBrand = false }: {
  asset: Asset
  idx: number
  list: Asset[]
  onOpen: (idx: number, list: Asset[]) => void
  onDelete: (id: number) => void
  onEdit?: (asset: Asset) => void
  isSelected?: boolean
  onToggleSelect?: (id: number) => void
  anySelected?: boolean
  showBrand?: boolean
}) {
  const isVid = asset.media === "video"
  const driveThumbnail = isVid ? toDriveThumbnailUrl(asset.fileURL) : null
  const isDriveVid = isVid && !!driveThumbnail

  // 선택 모드 활성화 시: 카드 클릭 → 선택 토글 (라이트박스 비활성화)
  const handleClick = () => {
    if (anySelected && onToggleSelect) {
      onToggleSelect(asset.id)
    } else {
      onOpen(idx, list)
    }
  }

  return (
    <div className={`asset-card${isSelected ? " selected" : ""}`} onClick={handleClick} role="button" aria-label={`${asset.title} 확대 보기`}>
      <div className="asset-thumb">
        {asset.fileURL ? (
          isDriveVid ? (
            <>
              <img src={driveThumbnail!} alt={asset.title} />
              <div className="play-overlay"><i className="ti ti-player-play" /></div>
            </>
          ) : isVid ? (
            <>
              <video src={asset.fileURL} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
              <div className="play-overlay"><i className="ti ti-player-play" /></div>
            </>
          ) : (
            <img src={asset.fileURL} alt={asset.title} />
          )
        ) : (
          <>
            <div className="asset-thumb-placeholder">
              <i className={`ti ${isVid ? "ti-video" : "ti-photo"}`} style={{ color: CAT_COLOR[asset.cat], fontSize: 28 }} />
            </div>
            {isVid && <div className="play-overlay"><i className="ti ti-player-play" /></div>}
          </>
        )}
        {asset.media === "carousel" && asset.carouselURLs && (
          <span className="carousel-badge">
            <i className="ti ti-layout-columns" style={{ fontSize: 10 }} />
            {asset.carouselURLs.length}
          </span>
        )}
        {/* 선택 시 썸네일 오버레이 */}
        {isSelected && <div className="asset-selected-overlay" />}
        {onEdit && (
          <button
            className="asset-edit-btn"
            onClick={e => { e.stopPropagation(); onEdit(asset) }}
            title="소재 수정"
          ><i className="ti ti-pencil" /></button>
        )}
        <button
          className="asset-delete-btn"
          onClick={e => { e.stopPropagation(); onDelete(asset.id) }}
          title="소재 삭제"
        ><i className="ti ti-trash" /></button>
        {onToggleSelect && (
          <div
            className={`asset-checkbox${isSelected ? " checked" : ""}${anySelected ? " always-show" : ""}`}
            onClick={e => { e.stopPropagation(); onToggleSelect(asset.id) }}
          >
            <i className={`ti ${isSelected ? "ti-square-check-filled" : "ti-square"}`} />
          </div>
        )}
      </div>
      <div className="asset-info">
        <div className="asset-name">{asset.title}</div>
        {(showBrand || !!asset.taskName) && (
          <div className="asset-brand-sub">
            {[showBrand ? asset.brand : null, asset.taskName || null].filter(Boolean).join(" · ")}
          </div>
        )}
      </div>
    </div>
  )
}

function HomeView({ assets, bm, searchQ, onSelectBrand, onDeleteBrand }: {
  assets: Asset[]
  bm: Record<string, BrandInfo>
  searchQ: string
  onSelectBrand: (brand: string, type: string) => void
  onDeleteBrand: (brand: string) => void
}) {
  // 브랜드+유형 조합을 고유 그룹으로 분리
  type BrandTypeGroup = { brand: string; type: string; cat: string }
  const groups: BrandTypeGroup[] = []
  const seen = new Set<string>()
  assets.forEach(a => {
    const key = `${a.brand}|${a.type}`
    if (!seen.has(key)) {
      seen.add(key)
      groups.push({ brand: a.brand, type: a.type, cat: a.cat })
    }
  })

  return (
    <div className="home-view">
      <div className="home-view-header">
        <div className="home-view-title">
          <i className="ti ti-home" />
          전체 소재
        </div>
        <span className="section-count">
          {searchQ ? `"${searchQ}" 검색 결과 · ` : ""}{groups.length}개 폴더
        </span>
      </div>
      {!groups.length ? (
        <div className="empty-state">
          <i className="ti ti-photo-off" />
          <p>{searchQ ? `"${searchQ}"에 해당하는 소재가 없습니다` : "업로드된 소재가 없습니다"}</p>
        </div>
      ) : CATS.map(cat => {
        const catGroups = groups.filter(g => g.cat === cat)
        if (!catGroups.length) return null
        return (
          <div key={cat}>
            <div className="section-header">
              <div className="section-title">
                <i className={`ti ${CAT_ICON[cat]}`} style={{ color: CAT_COLOR[cat], fontSize: 15 }} />
                {cat}
                <span className="section-count">{catGroups.length}개 폴더</span>
              </div>
            </div>
            <div className="brand-grid" style={{ marginBottom: 24 }}>
              {catGroups.map(({ brand: bn, type }) => {
                const filtered = assets.filter(a => a.brand === bn && a.type === type)
                const imgC = filtered.filter(a => a.media === "image" || a.media === "carousel").length
                const vidC = filtered.filter(a => a.media === "video").length
                const cls = CAT_CLASS[cat] || ""
                const st = type !== "과제" ? bm[bn]?.status : undefined
                const thumbAsset = filtered.find(a => a.fileURL && (a.media === "image" || a.media === "carousel"))
                const taskNames = [...new Set(filtered.map(a => a.taskName).filter(Boolean))] as string[]
                return (
                  <div key={`${bn}|${type}`} className={`brand-card cat-${cls}`} onClick={() => onSelectBrand(bn, type)}>
                    <div className="brand-card-thumb">
                      {thumbAsset?.fileURL ? (
                        <img src={thumbAsset.fileURL} alt={bn} className="brand-card-thumb-img" />
                      ) : (
                        <div className="brand-card-thumb-placeholder" style={{ color: CAT_COLOR[cat] }}>
                          <i className={`ti ${CAT_ICON[cat]}`} />
                        </div>
                      )}
                      {/* 수주 상태 뱃지 (비딩만) */}
                      {st && st !== "-" && (
                        <span className={`brand-status-badge bsb-${st === "수주" ? "win" : st === "수주취소" ? "cancel" : "hold"}`}>
                          {st}
                        </span>
                      )}
                      <button
                        className="brand-card-delete-btn"
                        onClick={e => {
                          e.stopPropagation()
                          if (confirm(`"${bn}" (${type}) 소재 ${filtered.length}개를 삭제할까요?`)) {
                            filtered.forEach(a => onDeleteBrand(a.brand))
                          }
                        }}
                        title="삭제"
                      >
                        <i className="ti ti-trash" />
                      </button>
                    </div>
                    <div className="brand-card-body">
                      <div className="brand-card-name-row">
                        <span className="brand-card-name">{bn}</span>
                        <span className={`brand-type-badge ${type === "비딩" ? "btb-bid" : "btb-task"}`}>{type}</span>
                      </div>
                      {taskNames.length > 0 && (
                        <div className="brand-card-task">{taskNames.join(" · ")}</div>
                      )}
                      <div className="brand-card-counts">
                        {imgC > 0 && <span className="count-pill"><i className="ti ti-photo" />{imgC}</span>}
                        {vidC > 0 && <span className="count-pill"><i className="ti ti-video" />{vidC}</span>}
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )
      })}
    </div>
  )
}

function FolderView({ brand, year, allAssets, bm, onBack, onOpenStatus, onOpenLightbox, onDeleteAsset, onEditAsset, onDeleteFolder }: {
  brand: string
  year?: string
  allAssets: Asset[]
  bm: Record<string, BrandInfo>
  onBack: () => void
  onOpenStatus: (brand: string) => void
  onOpenLightbox: (idx: number, list: Asset[]) => void
  onDeleteAsset: (id: number) => void
  onEditAsset: (asset: Asset) => void
  onDeleteFolder: (brand: string) => void
}) {
  const [selectedAssets, setSelectedAssets] = useState<Set<number>>(new Set())

  const toggleAssetSelect = (id: number) => {
    setSelectedAssets(prev => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const deleteSelectedAssets = () => {
    if (confirm(`선택한 ${selectedAssets.size}개 소재를 삭제할까요?`)) {
      Array.from(selectedAssets).forEach(id => onDeleteAsset(id))
      setSelectedAssets(new Set())
    }
  }

  const deleteSection = (label: string, sectionAssets: Asset[]) => {
    if (confirm(`"${label}" 폴더의 소재 ${sectionAssets.length}개를 삭제할까요?`)) {
      sectionAssets.forEach(a => onDeleteAsset(a.id))
    }
  }

  const b = bm[brand] || {} as BrandInfo
  const st = b.status || "-"
  const cat = b.cat || ""
  const catCls = CAT_CLASS[cat] || ""
  const imgs = allAssets.filter(a => a.media === "image")
  const carousels = allAssets.filter(a => a.media === "carousel")
  const vids = allAssets.filter(a => a.media === "video")
  const hasBidAssets = allAssets.some(a => a.type !== "과제")
  const statusBtnClass = st === "수주" ? "status-win" : st === "수주취소" ? "status-cancel" : st === "드롭" ? "status-hold" : "status-none"

  return (
    <>
      <div className="folder-header">
        <button className="btn-back" onClick={onBack}>
          <i className="ti ti-arrow-left" /> {year || "전체"}
        </button>
        <div className="folder-info">
          <div className="folder-name">
            <i className="ti ti-folder-filled" style={{ color: CAT_COLOR[cat], fontSize: 18 }} />
            {brand}
          </div>
          <div className="folder-meta-row">
            <span className={`folder-cat-tag cat-tag-${catCls}`}>{cat}</span>
            <span className="folder-count">{allAssets.length}개 소재</span>
          </div>
        </div>
        {hasBidAssets && (
          <button className={`folder-status-btn ${statusBtnClass}`} onClick={() => onOpenStatus(brand)}>
            <i className={`ti ${st === "수주" ? "ti-circle-check" : st === "수주취소" ? "ti-circle-x" : st === "드롭" ? "ti-clock" : "ti-circle-dotted"}`} style={{ fontSize: 13 }} />
            {st !== "-" ? st : "상태 설정"}
          </button>
        )}
        <button
          className="folder-delete-btn"
          onClick={() => {
            if (confirm(`"${brand}" 폴더와 소재 ${allAssets.length}개를 삭제할까요?`)) onDeleteFolder(brand)
          }}
          title="폴더 삭제"
        >
          <i className="ti ti-trash" style={{ fontSize: 13 }} /> 폴더 삭제
        </button>
      </div>

      {selectedAssets.size > 0 && (
        <div className="select-toolbar">
          <span className="select-count"><i className="ti ti-checkbox" />{selectedAssets.size}개 소재 선택됨</span>
          <div className="select-toolbar-actions">
            <button className="select-cancel-btn" onClick={() => setSelectedAssets(new Set())}>선택 해제</button>
            <button className="select-delete-btn" onClick={deleteSelectedAssets}><i className="ti ti-trash" /> 삭제</button>
          </div>
        </div>
      )}

      {!allAssets.length ? (
        <div className="empty-state"><i className="ti ti-photo-off" /><p>조건에 맞는 소재가 없습니다</p></div>
      ) : (() => {
        // 소구점 그룹이 있으면 그룹별로, 없으면 미디어 타입별로 표시
        const hasGroups = allAssets.some(a => a.group)
        if (hasGroups) {
          // 그룹 순서 유지 (첫 등장 순)
          const groupOrder: string[] = []
          allAssets.forEach(a => {
            const g = a.group || "기타"
            if (!groupOrder.includes(g)) groupOrder.push(g)
          })
          return (
            <>
              {groupOrder.map(g => {
                const gAssets = allAssets.filter(a => (a.group || "기타") === g)
                const gImgs = gAssets.filter(a => a.media === "image")
                const gCarousels = gAssets.filter(a => a.media === "carousel")
                const gVids = gAssets.filter(a => a.media === "video")
                return (
                  <div key={g} className="group-section">
                    <div className="group-section-header">
                      <i className="ti ti-folder-filled" style={{ color: CAT_COLOR[cat] || "var(--text-3)", fontSize: 14 }} />
                      <span className="group-section-name">{g}</span>
                      <button className="section-delete-btn" onClick={() => deleteSection(g, gAssets)} title="폴더 삭제">
                        <i className="ti ti-trash" />
                      </button>
                    </div>
                    {gImgs.length > 0 && (
                      <div className="media-section" style={{ marginTop: 8 }}>
                        <div className="media-section-label">
                          <i className="ti ti-photo" /> 이미지
                        </div>
                        <div className="media-grid">
                          {gImgs.map((a, i) => <AssetCard key={a.id} asset={a} idx={i} list={gImgs} onOpen={onOpenLightbox} onDelete={onDeleteAsset} onEdit={onEditAsset} isSelected={selectedAssets.has(a.id)} onToggleSelect={toggleAssetSelect} anySelected={selectedAssets.size > 0} />)}
                        </div>
                      </div>
                    )}
                    {gCarousels.length > 0 && (
                      <div className="media-section" style={{ marginTop: 8 }}>
                        <div className="media-section-label">
                          <i className="ti ti-layout-columns" /> 캐러셀
                        </div>
                        <div className="media-grid">
                          {gCarousels.map((a, i) => <AssetCard key={a.id} asset={a} idx={i} list={gCarousels} onOpen={onOpenLightbox} onDelete={onDeleteAsset} onEdit={onEditAsset} isSelected={selectedAssets.has(a.id)} onToggleSelect={toggleAssetSelect} anySelected={selectedAssets.size > 0} />)}
                        </div>
                      </div>
                    )}
                    {gVids.length > 0 && (
                      <div className="media-section" style={{ marginTop: 8 }}>
                        <div className="media-section-label">
                          <i className="ti ti-video" /> 영상
                        </div>
                        <div className="media-grid">
                          {gVids.map((a, i) => <AssetCard key={a.id} asset={a} idx={i} list={gVids} onOpen={onOpenLightbox} onDelete={onDeleteAsset} onEdit={onEditAsset} isSelected={selectedAssets.has(a.id)} onToggleSelect={toggleAssetSelect} anySelected={selectedAssets.size > 0} />)}
                        </div>
                      </div>
                    )}
                  </div>
                )
              })}
            </>
          )
        }
        // 그룹 없으면 기존 미디어 타입별 표시
        return (
          <>
            {imgs.length > 0 && (
              <div className="media-section">
                <div className="media-section-label">
                  <i className="ti ti-photo" /> 이미지
                  <button className="section-delete-btn" onClick={() => deleteSection("이미지", imgs)} title="이미지 전체 삭제">
                    <i className="ti ti-trash" />
                  </button>
                </div>
                <div className="media-grid">
                  {imgs.map((a, i) => <AssetCard key={a.id} asset={a} idx={i} list={imgs} onOpen={onOpenLightbox} onDelete={onDeleteAsset} onEdit={onEditAsset} isSelected={selectedAssets.has(a.id)} onToggleSelect={toggleAssetSelect} anySelected={selectedAssets.size > 0} />)}
                </div>
              </div>
            )}
            {carousels.length > 0 && (
              <div className="media-section">
                <div className="media-section-label">
                  <i className="ti ti-layout-columns" /> 캐러셀
                  <button className="section-delete-btn" onClick={() => deleteSection("캐러셀", carousels)} title="캐러셀 전체 삭제">
                    <i className="ti ti-trash" />
                  </button>
                </div>
                <div className="media-grid">
                  {carousels.map((a, i) => <AssetCard key={a.id} asset={a} idx={i} list={carousels} onOpen={onOpenLightbox} onDelete={onDeleteAsset} onEdit={onEditAsset} isSelected={selectedAssets.has(a.id)} onToggleSelect={toggleAssetSelect} anySelected={selectedAssets.size > 0} />)}
                </div>
              </div>
            )}
            {vids.length > 0 && (
              <div className="media-section">
                <div className="media-section-label">
                  <i className="ti ti-video" /> 영상
                  <button className="section-delete-btn" onClick={() => deleteSection("영상", vids)} title="영상 전체 삭제">
                    <i className="ti ti-trash" />
                  </button>
                </div>
                <div className="media-grid">
                  {vids.map((a, i) => <AssetCard key={a.id} asset={a} idx={i} list={vids} onOpen={onOpenLightbox} onDelete={onDeleteAsset} onEdit={onEditAsset} isSelected={selectedAssets.has(a.id)} onToggleSelect={toggleAssetSelect} anySelected={selectedAssets.size > 0} />)}
                </div>
              </div>
            )}
          </>
        )
      })()}
    </>
  )
}

function AllBrandsView({ bm, filteredAssets, onSelectBrand, onDeleteBrand, onBack, backLabel = "연도 목록", selStatus, onSetStatus }: {
  year?: string
  bm: Record<string, BrandInfo>
  filteredAssets: Asset[]
  onSelectBrand: (brand: string) => void
  onDeleteBrand: (brand: string) => void
  onBack?: () => void
  backLabel?: string
  selStatus?: string
  onSetStatus?: (v: string) => void
}) {
  const visibleBrands = [...new Set(filteredAssets.map(a => a.brand))]

  return (
    <>
      {onBack && (
        <div className="folder-header" style={{ marginBottom: 16 }}>
          <button className="btn-back" onClick={onBack}>
            <i className="ti ti-arrow-left" /> {backLabel}
          </button>
          {selStatus !== undefined && onSetStatus && (
            <div className="sf-status-btns" style={{ marginLeft: "auto" }}>
              {([
                { value: "수주",   label: "수주",   cls: "win" },
                { value: "수주취소", label: "수주취소", cls: "cancel" },
                { value: "드롭",   label: "드롭",   cls: "hold" },
              ] as const).map(({ value, label, cls }) => (
                <button
                  key={value}
                  className={`sf-status-btn ssb-${cls}${selStatus === value ? " on" : ""}`}
                  onClick={() => onSetStatus(selStatus === value ? "all" : value)}
                >
                  {label}
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {!visibleBrands.length ? (
        <div className="empty-state"><i className="ti ti-photo-off" /><p>조건에 맞는 소재가 없습니다</p></div>
      ) : CATS.map(cat => {
        const brands = visibleBrands.filter(bn => bm[bn]?.cat === cat)
        if (!brands.length) return null
        return (
          <div key={cat}>
            <div className="section-header">
              <div className="section-title">
                <i className={`ti ${CAT_ICON[cat]}`} style={{ color: CAT_COLOR[cat], fontSize: 15 }} />
                {cat}
                <span className="section-count">{brands.length}개 브랜드</span>
              </div>
            </div>
            <div className="brand-grid" style={{ marginBottom: 24 }}>
              {brands.map(bn => {
                const filtered = filteredAssets.filter(a => a.brand === bn)
                const imgC = filtered.filter(a => a.media === "image" || a.media === "carousel").length
                const vidC = filtered.filter(a => a.media === "video").length
                const cls = CAT_CLASS[cat] || ""
                const hasBid = filtered.some(a => a.type !== "과제")
                const st = hasBid ? bm[bn]?.status : undefined
                // 대표이미지: fileURL이 있는 첫 번째 이미지/캐러셀 소재
                const thumbAsset = filtered.find(a => a.fileURL && (a.media === "image" || a.media === "carousel"))
                const taskNames = [...new Set(filtered.map(a => a.taskName).filter(Boolean))] as string[]
                return (
                  <div key={bn} className={`brand-card cat-${cls}`} onClick={() => onSelectBrand(bn)}>
                    {/* 썸네일 영역 */}
                    <div className="brand-card-thumb">
                      {thumbAsset?.fileURL ? (
                        <img src={thumbAsset.fileURL} alt={bn} className="brand-card-thumb-img" />
                      ) : (
                        <div className="brand-card-thumb-placeholder" style={{ color: CAT_COLOR[cat] }}>
                          <i className={`ti ${CAT_ICON[cat]}`} />
                        </div>
                      )}
                      {/* 수주 상태 뱃지 — 우측 하단 */}
                      {st && st !== "-" && (
                        <span className={`brand-status-badge bsb-${st === "수주" ? "win" : st === "수주취소" ? "cancel" : "hold"}`}>
                          {st}
                        </span>
                      )}
                      {/* 삭제 버튼 */}
                      <button
                        className="brand-card-delete-btn"
                        onClick={e => {
                          e.stopPropagation()
                          if (confirm(`"${bn}" 브랜드와 소재 ${filtered.length}개를 삭제할까요?`)) onDeleteBrand(bn)
                        }}
                        title="브랜드 삭제"
                      >
                        <i className="ti ti-trash" />
                      </button>
                    </div>
                    {/* 정보 영역 */}
                    <div className="brand-card-body">
                      <div className="brand-card-name">{bn}</div>
                      {taskNames.length > 0 && (
                        <div className="brand-card-task">{taskNames.join(" · ")}</div>
                      )}
                      <div className="brand-card-counts">
                        {imgC > 0 && <span className="count-pill"><i className="ti ti-photo" />{imgC}</span>}
                        {vidC > 0 && <span className="count-pill"><i className="ti ti-video" />{vidC}</span>}
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )
      })}
    </>
  )
}

function YearView({ years, assets, onSelectYear }: {
  years: string[]
  assets: Asset[]
  onSelectYear: (year: string) => void
}) {
  if (!years.length) {
    return <div className="empty-state"><i className="ti ti-calendar-off" /><p>등록된 소재가 없습니다</p></div>
  }
  return (
    <div>
      <div className="section-header">
        <div className="section-title">
          <i className="ti ti-calendar" style={{ color: "var(--purple)", fontSize: 15 }} />
          연도별 폴더
          <span className="section-count">{years.length}개 연도</span>
        </div>
      </div>
      <div className="year-grid">
        {years.map(year => {
          const yAssets = assets.filter(a => a.year === year)
          const brandCount = new Set(yAssets.map(a => a.brand)).size
          return (
            <div key={year} className="year-card" onClick={() => onSelectYear(year)}>
              <div className="year-card-year">{year}</div>
              <div className="year-card-sub">{brandCount}개 브랜드</div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

function TypeView({ assets, onSelectType }: {
  assets: Asset[]
  onSelectType: (type: string) => void
}) {
  const types = ["비딩", "과제"]
  return (
    <div>
      <div className="section-header">
        <div className="section-title">
          <i className="ti ti-tag" style={{ color: "var(--blue)", fontSize: 15 }} />
          유형별 폴더
          <span className="section-count">2개 유형</span>
        </div>
      </div>
      <div className="year-grid">
        {types.map(type => {
          const tAssets = assets.filter(a => a.type === type)
          const brandCount = new Set(tAssets.map(a => a.brand)).size
          return (
            <div key={type} className="year-card" onClick={() => onSelectType(type)}>
              <div className="year-card-year">{type}</div>
              <div className="year-card-sub">{brandCount}개 브랜드</div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

function CategoryView({ assets, onSelectCat }: {
  assets: Asset[]
  onSelectCat: (cat: string) => void
}) {
  const activeCats = CATS.filter(cat => assets.some(a => a.cat === cat))
  if (!activeCats.length) {
    return <div className="empty-state"><i className="ti ti-layout-grid" /><p>등록된 소재가 없습니다</p></div>
  }
  return (
    <div>
      <div className="section-header">
        <div className="section-title">
          <i className="ti ti-layout-grid" style={{ color: "var(--purple)", fontSize: 15 }} />
          카테고리별 폴더
          <span className="section-count">{activeCats.length}개 카테고리</span>
        </div>
      </div>
      <div className="year-grid">
        {activeCats.map(cat => {
          const cAssets = assets.filter(a => a.cat === cat)
          const brandCount = new Set(cAssets.map(a => a.brand)).size
          return (
            <div key={cat} className="year-card" onClick={() => onSelectCat(cat)}>
              <div className="year-card-year">{cat}</div>
              <div className="year-card-sub">{brandCount}개 브랜드</div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
