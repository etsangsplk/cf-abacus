'use strict';

const { each, omit, clone, extend } = require('underscore');

const { findResourceById, findMetricByName, findPlanById, findSpaceById, findConsumerById } = require('./finder');

const _subtractWindows = (windowsA, windowsB) => {
  const resultWindows = [];
  each(windowsA, (window, windowIndex) => {
    if(!windowsB[windowIndex])
      throw new Error('Invalid report');
    
    const resultWindow = [];
      
    each(window, (element, index) => {
      if(element) 
        resultWindow.push({
          summary: element.summary - windowsB[windowIndex][index].summary,
          quantity: element.quantity - windowsB[windowIndex][index].quantity
        });
      else
        resultWindow.push(null);
    }); 
    resultWindows.push(resultWindow);
  });
  return resultWindows;
};

const _subtractAggregatedUsages = (aggregatedUsageA, aggregatedUsageB) => {
  const resultAggregatedUsage = [];
  each(aggregatedUsageA, (au) => {

    resultAggregatedUsage.push({
      metric: au.metric,
      windows: _subtractWindows(au.windows, findMetricByName(au.metric, aggregatedUsageB).windows)
    });
    
  });
  return resultAggregatedUsage;
};

const _subtractPlans = (plansA, plansB) => {
  const resultPlans = [];
  each(plansA, (plan) => {
    resultPlans.push(extend(clone(omit(plan, 'aggregated_usage')), { 
      aggregated_usage: _subtractAggregatedUsages(plan.aggregated_usage, 
        findPlanById(plan.plan_id, plansB).aggregated_usage)
    }));
  });
  return resultPlans;
};

const _subtractResources = (resourcesA, resourcesB) => {
  if(!resourcesB || resourcesB.length === 0)
    return resourcesA;

  const resultResources = [];
  
  each(resourcesA, (resourceA) => {
    const resourceB = findResourceById(resourceA.resource_id, resourcesB);
    resultResources.push({
      resource_id: resourceA.resource_id,
      plans: _subtractPlans(resourceA.plans, resourceB.plans),
      aggregated_usage: _subtractAggregatedUsages(resourceA.aggregated_usage, resourceB.aggregated_usage)
    });
  });
  return resultResources;
};

const _subtractConsumers = (consumersA, consumersB) => {
  const resultConsumers = [];
  
  each(consumersA, (consumerA) => {
    resultConsumers.push({
      consumer_id: consumerA.consumer_id,
      resources: _subtractResources([findResourceById('object-storage',consumerA.resources)], 
        findConsumerById(consumerA.consumer_id, consumersB).resources)
    });
  });
  return resultConsumers;
};

const _subtractSpaces = (spacesA, spacesB) => {
  if(!spacesB || spacesB.length === 0)
    return spacesA;
  
  const resultSpaces = [];
  each(spacesA, (spaceA) => {
    const spaceB = findSpaceById(spaceA.space_id, spacesB);
    resultSpaces.push({
      space_id: spaceA.space_id,
      resources: _subtractResources([findResourceById('object-storage', spaceA.resources)], spaceB.resources),
      consumers: _subtractConsumers(spaceA.consumers, spaceB.consumers)
    });
  });  
  return resultSpaces;
}; 

const subtractReports = (reportA, reportB) => ({
  organization_id: reportA.organization_id,
  resources: _subtractResources([findResourceById('object-storage', reportA.resources)], reportB.resources),
  spaces: _subtractSpaces(reportA.spaces, reportB.spaces),
  account_id: reportA.account_id
});


module.exports = {
  subtractReports
};
