(async () => {
  'use strict';const root=document.getElementById('takuya-library');if(!root)return;
  try {
    const r=await fetch('/library/library.json');if(!r.ok)throw new Error('读取失败');const docs=await r.json();
    root.replaceChildren();const search=document.createElement('input');search.type='search';search.placeholder='搜索资料名称 / 分类';search.setAttribute('aria-label','搜索 PDF 资料');root.append(search);
    const list=document.createElement('div');list.className='takuya-library';root.append(list);
    const draw=()=>{list.replaceChildren();const filtered=docs.filter(d=>(d.title+' '+d.category).toLowerCase().includes(search.value.toLowerCase()));
      for(const d of filtered){if(!/^\/media\/[a-f0-9]{32}\.pdf$/.test(d.file))continue;
        const article=document.createElement('article');article.className='takuya-document';const h=document.createElement('h2');h.textContent=d.title;article.append(h);
        const p=document.createElement('p');p.textContent=(d.category?d.category+' · ':'')+(d.size/1048576).toFixed(2)+' MiB';article.append(p);
        if(d.description){const desc=document.createElement('p');desc.textContent=d.description;article.append(desc);}
        const actions=document.createElement('div');actions.className='document-actions';const open=document.createElement('a');open.href=d.file;open.target='_blank';open.rel='noopener';open.textContent='新窗口查看 ↗';actions.append(open);
        const down=document.createElement('a');down.href=d.file;down.download=d.title+'.pdf';down.textContent='下载文件 ↓';actions.append(down);article.append(actions);
        const details=document.createElement('details');const summary=document.createElement('summary');summary.textContent='展开网页内预览';details.append(summary);
        details.addEventListener('toggle',()=>{if(details.open&&!details.querySelector('iframe')){const frame=document.createElement('iframe');frame.title=d.title;frame.loading='lazy';frame.src=d.file;frame.setAttribute('sandbox','allow-same-origin allow-downloads');details.append(frame);}});article.append(details);list.append(article);}
      if(!list.children.length){const p=document.createElement('p');p.textContent='暂无匹配的公开资料。';list.append(p);}};
    search.addEventListener('input',draw);draw();
  }catch{root.textContent='资料库暂时无法加载，请稍后再试。';}
})();
