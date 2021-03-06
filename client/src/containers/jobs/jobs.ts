import * as _ from 'lodash';
import { connect } from 'react-redux';
import { withRouter } from 'react-router-dom';
import { Dispatch } from 'redux';

import Jobs from '../../components/jobs/jobs';
import { AppState } from '../../constants/types';
import { isTrue } from '../../constants/utils';
import { JobModel } from '../../models/job';

import * as actions from '../../actions/jobs';
import * as search_actions from '../../actions/search';
import { ACTIONS } from '../../constants/actions';
import { SearchModel } from '../../models/search';
import { ARCHIVES, BOOKMARKS } from '../../utils/endpointList';
import { getErrorsGlobal } from '../../utils/errors';

interface OwnProps {
  user: string;
  projectName?: string;
  groupId?: string;
  useFilters?: boolean;
  showBookmarks?: boolean;
  showDeleted?: boolean;
  endpointList?: string;
  fetchData?: () => actions.JobAction;
}

export function mapStateToProps(state: AppState, ownProps: OwnProps) {
  // let useFilter = () => {
  //   let jobs: JobModel[] = [];
  //   let project = state.projects.byUniqueNames[ownProps.projectName];
  //   let jobNames = project.jobs;
  //   jobNames = getPaginatedSlice(jobNames);
  //   jobNames.forEach(
  //     function (job: string, idx: number) {
  //       jobs.push(state.jobs.byUniqueNames[job]);
  //     });
  //   return {jobs: jobs, count: project.num_jobs};
  // };

  const useLastFetched = () => {
    const jobNames = state.jobs.lastFetched.names;
    const count = state.jobs.lastFetched.count;
    const jobs: JobModel[] = [];
    jobNames.forEach(
      (job: string, idx: number) => {
        jobs.push(state.jobs.byUniqueNames[job]);
      });
    return {jobs, count};
  };
  const results = useLastFetched();

  const isLoading = isTrue(state.loadingIndicators.jobs.global.fetch);
  return {
    isCurrentUser: state.auth.user === ownProps.user,
    jobs: results.jobs,
    count: results.count,
    useFilters: isTrue(ownProps.useFilters),
    showBookmarks: isTrue(ownProps.showBookmarks),
    showDeleted: isTrue(ownProps.showDeleted),
    endpointList: ownProps.endpointList,
    isLoading,
    errors: getErrorsGlobal(state.alerts.jobs.global, isLoading, ACTIONS.FETCH),
  };
}

export interface DispatchProps {
  onCreate?: (job: JobModel) => actions.JobAction;
  onDelete: (jobName: string) => actions.JobAction;
  onStop: (jobName: string) => actions.JobAction;
  onArchive: (jobName: string) => actions.JobAction;
  onRestore: (jobName: string) => actions.JobAction;
  bookmark: (jobName: string) => actions.JobAction;
  unbookmark: (jobName: string) => actions.JobAction;
  onUpdate?: (job: JobModel) => actions.JobAction;
  fetchData?: (offset?: number, query?: string, sort?: string) => actions.JobAction;
  fetchSearches?: () => search_actions.SearchAction;
  createSearch?: (data: SearchModel) => search_actions.SearchAction;
  deleteSearch?: (searchId: number) => search_actions.SearchAction;
}

export function mapDispatchToProps(dispatch: Dispatch<actions.JobAction>, params: any): DispatchProps {
  return {
    onCreate: (job: JobModel) => dispatch(actions.createJob(
      params.match.params.user,
      params.match.params.projectName,
      job,
      true)),
    onDelete: (jobName: string) => dispatch(actions.deleteJob(jobName)),
    onStop: (jobName: string) => dispatch(actions.stopJob(jobName)),
    onArchive: (jobName: string) => dispatch(actions.archiveJob(jobName)),
    onRestore: (jobName: string) => dispatch(actions.restoreJob(jobName)),
    bookmark: (jobName: string) => dispatch(actions.bookmark(jobName)),
    unbookmark: (jobName: string) => dispatch(actions.unbookmark(jobName)),
    onUpdate: (job: JobModel) => dispatch(actions.updateJobSuccessActionCreator(job)),
    fetchSearches: () => {
      if (params.projectName) {
        return dispatch(search_actions.fetchJobSearches(params.projectName));
      } else {
        throw new Error('Jobs container does not have project.');
      }
    },
    createSearch: (data: SearchModel) => {
      if (params.projectName) {
        return dispatch(search_actions.createJobSearch(params.projectName, data));
      } else {
        throw new Error('Builds container does not have project.');
      }
    },
    deleteSearch: (searchId: number) => {
      if (params.projectName) {
        return dispatch(search_actions.deleteJobSearch(params.projectName, searchId));
      } else {
        throw new Error('Builds container does not have project.');
      }
    },
    fetchData: (offset?: number, query?: string, sort?: string) => {
      const filters: { [key: string]: number | boolean | string } = {};
      if (query) {
        filters.query = query;
      }
      if (sort) {
        filters.sort = sort;
      }
      if (offset) {
        filters.offset = offset;
      }
      if (_.isNil(params.projectName) && params.endpointList === BOOKMARKS) {
        return dispatch(actions.fetchBookmarkedJobs(params.user, filters));
      } else if (_.isNil(params.projectName) && params.endpointList === ARCHIVES) {
        return dispatch(actions.fetchArchivedJobs(params.user, filters));
      } else if (params.projectName) {
        return dispatch(actions.fetchJobs(params.projectName, filters));
      } else {
        throw new Error('Jobs container expects either a project name or bookmarks or archives.');
      }
    }
  };
}

export default withRouter(connect(mapStateToProps, mapDispatchToProps)(Jobs));
