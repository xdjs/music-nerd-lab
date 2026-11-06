import React from 'react';

export function CatalogLoading(){
 return <div className="catalog-loading" role="status" aria-label="Loading recipes">
  <div className="app-grid" aria-hidden="true">{[0,1,2].map(i=><div className="catalog-placeholder" key={i}>
   <div className="placeholder-art"/>
   <div className="placeholder-title"/>
   <div className="placeholder-description"/>
   <div className="placeholder-creator"/>
  </div>)}</div>
 </div>;
}
