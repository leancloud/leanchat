import { useMemo, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { Button, Progress } from 'antd';
import { read, utils } from 'xlsx';
import _ from 'lodash';

import { Category } from '@/Panel/types';
import { CreateCategoryData, createCategorys } from '@/Panel/api/category';

interface XnCategory {
  id?: string;
  name: string;
  path: string[];
  children: XnCategory[];
}

const findXnCategory = (xncs: XnCategory[], path: string[]) => {
  let current: XnCategory | undefined;
  for (const name of path) {
    current = xncs.find((t) => t.name === name);
    if (current) {
      xncs = current.children;
    } else {
      break;
    }
  }
  return current;
};

const getPath = (categories: Category[], category: Category) => {
  const path: string[] = [];
  let current: Category | undefined = category;
  while (current) {
    path.push(current.name);
    if (current.parentId) {
      current = categories.find((c) => c.id === current!.parentId);
    } else {
      break;
    }
  }
  return path.reverse();
};

interface ImportXiaonengProps {
  categories?: Category[];
}

export function ImportXiaoneng({ categories }: ImportXiaonengProps) {
  const [xnCategories, setXnCategories] = useState<XnCategory[]>();
  const [importCount, setImportCount] = useState(0);
  const [done, setDone] = useState(false);

  const handleChangeFile = async (file?: File) => {
    if (file) {
      const xncs: XnCategory[] = [];

      if (categories) {
        const category2XnCategory = (c: Category): XnCategory => {
          return {
            id: c.id,
            name: c.name,
            path: getPath(categories, c),
            children: [],
          };
        };

        const queue: XnCategory[] = categories.filter((c) => !c.parentId).map(category2XnCategory);
        xncs.push(...queue);
        while (queue.length) {
          const first = queue.shift()!;
          first.children = categories
            .filter((c) => c.parentId === first.id)
            .map(category2XnCategory);
          queue.push(...first.children);
        }
      }

      const wb = read(await file.arrayBuffer());
      const ws = wb.Sheets[wb.SheetNames[0]];
      const rows = utils.sheet_to_json<Record<string, string>>(ws);

      for (const row of rows) {
        const path = Object.values(row);
        if (path.length > 0) {
          if (!findXnCategory(xncs, path)) {
            const c: XnCategory = {
              name: path[path.length - 1],
              path,
              children: [],
            };
            if (path.length === 1) {
              xncs.push(c);
            } else {
              const parent = findXnCategory(xncs, path.slice(0, -1));
              if (parent) {
                parent.children.push(c);
              }
            }
          }
        }
      }

      setXnCategories(xncs);
    }
  };

  const startImport = async (categories: XnCategory[], parentId?: string) => {
    const needImport = categories.filter((c) => !c.id);
    const data: CreateCategoryData[] = needImport.map((c) => ({
      parentId,
      name: c.path[c.path.length - 1],
    }));
    let index = 0;
    for (const chunk of _.chunk(data, 100)) {
      const result = await createCategorys(data);
      for (const c of result) {
        needImport[index].id = c.id;
        index += 1;
      }
      setImportCount((cnt) => cnt + chunk.length);
    }
    for (const c of categories) {
      if (c.id) {
        await startImport(c.children, c.id);
      }
    }
  };

  const queryClient = useQueryClient();

  const handleImport = async () => {
    if (xnCategories) {
      const rootCategories = xnCategories.filter((c) => c.path.length === 1);
      await startImport(rootCategories);
      toast.success('导入完成');
      queryClient.invalidateQueries(['Categories']);
      setDone(true);
    }
  };

  const createCount = useMemo(() => {
    const queue = (xnCategories || []).slice();
    const needImport: XnCategory[] = [];
    while (queue.length) {
      const first = queue.shift()!;
      if (!first.id) {
        needImport.push(first);
      }
      queue.push(...first.children);
    }
    console.log(needImport);
    return needImport.length;
  }, [xnCategories]);

  return (
    <div>
      {!done && (
        <>
          <input
            type="file"
            onChange={(e) => {
              handleChangeFile(e.target.files?.[0]);
              e.target.value = '';
              setImportCount(0);
            }}
          />
          {createCount !== undefined && <div>导入 {createCount} 个分类</div>}
          <div>
            <Button disabled={!createCount} onClick={handleImport}>
              开始导入
            </Button>
          </div>
        </>
      )}
      <Progress percent={createCount && Math.floor((importCount / createCount) * 100)} />
    </div>
  );
}
