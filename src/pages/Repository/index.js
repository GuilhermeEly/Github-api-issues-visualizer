/* eslint-disable react/static-property-placement */
import React, { Component } from 'react';
import { Link } from 'react-router-dom';
import PropTypes from 'prop-types';
import api from '../../services/api';

import Container from '../../components/Container';
import { Loading, Owner, IssueList, IssueFilter, PageSelector } from './styles';

export default class Repository extends Component {
  static propTypes = {
    match: PropTypes.shape({
      params: PropTypes.shape({
        repository: PropTypes.string
      })
    }).isRequired
  };

  state = {
    repository: {},
    issues: [],
    loading: true,
    filter: [
      { selection: 'all', label: 'Todos', status: true },
      { selection: 'open', label: 'Abertos', status: false },
      { selection: 'closed', label: 'Fechados', status: false }
    ],
    indexFilter: 0,
    page: 1
  };

  async componentDidMount() {
    const { match } = this.props;

    const repoName = decodeURIComponent(match.params.repository);

    const [repository, issues] = await Promise.all([
      api.get(`/repos/${repoName}`),
      api.get(`/repos/${repoName}/issues`, {
        params: {
          state: 'open',
          per_page: 5
        }
      })
    ]);

    this.setState({
      repository: repository.data,
      issues: issues.data,
      loading: false
    });
  }

  handleFilterClick = async filterIndex => {
    this.setState({
      indexFilter: filterIndex
    });
    this.loadFilterIssues(filterIndex);
  };

  loadFilterIssues = async () => {
    const { match } = this.props;

    const { filter, indexFilter, page } = this.state;

    const repoName = decodeURIComponent(match.params.repository);

    const response = await api.get(`/repos/${repoName}/issues`, {
      params: {
        state: filter[indexFilter].selection,
        per_page: 5,
        page
      }
    });
    this.setState({
      issues: response.data
    });
  };

  handlePageClick = action => {
    const { page } = this.state;
    this.setState({
      page: action === 'subtract' ? page - 1 : page + 1
    });
    this.loadFilterIssues();
  };

  render() {
    const {
      repository,
      issues,
      loading,
      filter,
      indexFilter,
      page
    } = this.state;

    if (loading) {
      return <Loading>Carregando</Loading>;
    }

    return (
      <Container>
        <Owner>
          <Link to="/">Voltar aos repositórios</Link>
          <img src={repository.owner.avatar_url} alt={repository.owner.login} />
          <h1>{repository.name}</h1>
          <p>{repository.description}</p>
        </Owner>

        <IssueList>
          <IssueFilter selection={indexFilter}>
            {filter.map((selection, index) => (
              <button
                type="button"
                key={selection.label}
                onClick={() => this.handleFilterClick(index)}
              >
                {selection.label}
              </button>
            ))}
          </IssueFilter>
          {issues.map(issue => (
            <li key={String(issue.id)}>
              <img src={issue.user.avatar_url} alt={issue.user.login} />
              <div>
                <strong>
                  <a href={issue.html_url}>{issue.title}</a>
                  {issue.labels.map(label => (
                    <span key={String(label.id)}>{label.name}</span>
                  ))}
                </strong>
                <p>{issue.user.login}</p>
              </div>
            </li>
          ))}
        </IssueList>
        <PageSelector>
          <button
            type="button"
            onClick={() => this.handlePageClick('subtract')}
            disabled={page < 2}
          >
            Anterior
          </button>
          <span>Página {page}</span>
          <button type="button" onClick={() => this.handlePageClick('add')}>
            Próximo
          </button>
        </PageSelector>
      </Container>
    );
  }
}
