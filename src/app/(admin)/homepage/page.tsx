'use client';

import { useCallback, useEffect, useState } from 'react';
import { Loader2, Save } from 'lucide-react';
import { toast } from 'sonner';
import { apiClient } from '@/lib/api-client';
import type {
  BannerRow,
  BrandSettings,
  CategoryRow,
  CategorySectionRow,
  HotRecommendationRow,
} from '@/lib/types';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { BannerManager } from '@/components/admin/banner-manager';
import { SectionManager } from '@/components/admin/section-manager';
import { HotManager } from '@/components/admin/hot-manager';

interface HomepageData {
  banners: BannerRow[];
  sections: CategorySectionRow[];
  hotRecommendations: HotRecommendationRow[];
  brand: BrandSettings;
}

export default function HomepagePage() {
  const [data, setData] = useState<HomepageData | null>(null);
  const [categories, setCategories] = useState<CategoryRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [brand, setBrand] = useState<BrandSettings>({
    studio_name: '',
    slogan_primary: '',
    slogan_secondary: '',
  });
  const [savingBrand, setSavingBrand] = useState(false);

  const load = useCallback(async () => {
    try {
      const [res, cats] = await Promise.all([
        apiClient.get<HomepageData>('/admin/homepage'),
        apiClient.get<{ items: CategoryRow[] }>('/admin/categories?all=0'),
      ]);
      setData(res);
      setBrand(res.brand);
      setCategories(cats.items);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : '加载失败');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const refresh = useCallback(() => {
    apiClient
      .get<HomepageData>('/admin/homepage')
      .then(setData)
      .catch(() => undefined);
  }, []);

  const saveBrand = async () => {
    if (!brand.studio_name.trim() || !brand.slogan_primary.trim()) {
      return toast.error('工作室名称与主 Slogan 不能为空');
    }
    setSavingBrand(true);
    try {
      await apiClient.put('/admin/homepage/brand', brand);
      toast.success('品牌文案已保存，小程序将同步生效');
    } catch (e) {
      toast.error(e instanceof Error ? e.message : '保存失败');
    } finally {
      setSavingBrand(false);
    }
  };

  if (loading || !data) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Loader2 className="h-5 w-5 animate-spin text-brand" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <section>
        <h1 className="font-serif text-2xl tracking-wide">首页内容</h1>
        <p className="mt-1 text-sm text-muted">编辑小程序首页的品牌文案与展示内容，保存后实时同步。</p>
      </section>

      <Card className="card-luxury">
        <CardContent className="space-y-5 p-6">
          <div>
            <h2 className="font-serif text-lg tracking-wide">品牌文案</h2>
            <p className="text-xs text-muted">展示在小程序首页头部的品牌名与 Slogan。</p>
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-1.5">
              <label className="text-xs tracking-widest text-muted">工作室名称</label>
              <Input
                value={brand.studio_name}
                maxLength={64}
                onChange={(e) => setBrand((b) => ({ ...b, studio_name: e.target.value }))}
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs tracking-widest text-muted">主 Slogan</label>
              <Input
                value={brand.slogan_primary}
                maxLength={128}
                placeholder="一束花，一段故事"
                onChange={(e) => setBrand((b) => ({ ...b, slogan_primary: e.target.value }))}
              />
            </div>
          </div>
          <div className="space-y-1.5">
            <label className="text-xs tracking-widest text-muted">副文案（可选）</label>
            <Textarea
              rows={2}
              maxLength={255}
              value={brand.slogan_secondary ?? ''}
              placeholder="甄选当季花材，以法式美学定制每一份心意"
              onChange={(e) => setBrand((b) => ({ ...b, slogan_secondary: e.target.value }))}
            />
          </div>
          <div className="flex justify-end">
            <Button onClick={saveBrand} disabled={savingBrand}>
              {savingBrand ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
              保存品牌文案
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card className="card-luxury">
        <CardContent className="space-y-5 p-6">
          <div>
            <h2 className="font-serif text-lg tracking-wide">Banner 轮播图</h2>
            <p className="text-xs text-muted">建议尺寸 750 × 420（16:9），按排序权重依次轮播。</p>
          </div>
          <BannerManager banners={data.banners} onChange={refresh} />
        </CardContent>
      </Card>

      <Card className="card-luxury">
        <CardContent className="space-y-5 p-6">
          <div>
            <h2 className="font-serif text-lg tracking-wide">品类主题宣传区</h2>
            <p className="text-xs text-muted">用主题图引导进入对应品类，适合竖版宣传图（3:4）。</p>
          </div>
          <SectionManager
            sections={data.sections}
            categories={categories}
            onChange={refresh}
          />
        </CardContent>
      </Card>

      <Card className="card-luxury">
        <CardContent className="space-y-5 p-6">
          <div>
            <h2 className="font-serif text-lg tracking-wide">热门花礼推荐位</h2>
            <p className="text-xs text-muted">从在售商品中挑选主推花礼，展示在小程序首页推荐区。</p>
          </div>
          <HotManager items={data.hotRecommendations} onChange={refresh} />
        </CardContent>
      </Card>
    </div>
  );
}
